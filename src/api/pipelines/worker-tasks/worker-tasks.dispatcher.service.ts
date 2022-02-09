import { MetaInternalResult } from '@metaio/microservice-model';
import { MetaWorker } from '@metaio/worker-model2';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { IWorkerTask } from '../../../entities/pipeline/worker-task.interface';
import { DataNotFoundException } from '../../../exceptions';
import { UCenterJWTPayload, UCenterUser } from '../../../types';
import { SiteStatus } from '../../../types/enum';
import {
  WorkerModel2Config,
  WorkerModel2TaskConfig,
} from '../../../types/worker-model2';
import { iso8601ToDate } from '../../../utils';
import { MetaNetworkModule } from '../../microservices/meta-network/meta-network.module';
import { PublisherService } from '../../provider/publisher/publisher.service';
import { WorkerModel2PublisherService } from '../../provider/publisher/worker-model2.publisher.service';
import { StorageService } from '../../provider/storage/service';
import { WorkerModel2StorageService } from '../../provider/storage/worker-model2.service';
import { SiteService } from '../../site/service';
import { WorkerModel2SiteService } from '../../site/worker-model2.service';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { SiteTasksLogicService } from '../site-tasks/site-tasks.logic.service';
import {
  WORKER_TASKS_JOB_PROCESSOR,
  WorkerTasksJobDetail,
} from './processors/worker-tasks.job-processor';

@Injectable()
export class WorkerTasksDispatcherService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly postTasksLogicService: PostTasksLogicService,
    private readonly siteTasksLogicService: SiteTasksLogicService,
    private readonly siteService: WorkerModel2SiteService,
    private readonly storageService: WorkerModel2StorageService,
    private readonly publisherService: WorkerModel2PublisherService,
    @InjectQueue(WORKER_TASKS_JOB_PROCESSOR)
    protected readonly workerTasksQueue: Queue<WorkerTasksJobDetail>,
  ) {}

  async handlePostTaskBySiteConfigId(siteConfigId: number) {
    const { postTaskEntity, postOrderEntities, postMetadataEntities } =
      await this.postTasksLogicService.getPendingPostsBySiteConfigId(
        siteConfigId,
      );
    const user = await this.getUserById(postTaskEntity.userId);
    const posts = [];
    for (let i = 0; i < postOrderEntities.length; i++) {
      const postOrderEntity = postOrderEntities[i];
      const postMetaDataEntity = postMetadataEntities[i];
      const post = {
        title: postMetaDataEntity.title,
        cover: postMetaDataEntity.cover,
        summary: postMetaDataEntity.summary,
        source: postMetaDataEntity.content,
        categories: postMetaDataEntity.categories.split(','),
        tags: postMetaDataEntity.tags.split(','),
        license: postMetaDataEntity.license,

        serverVerificationMetadataStorageType:
          postOrderEntity.certificateStorageType,
        serverVerificationMetadataRefer: postOrderEntity.certificateId,
        createdAt: iso8601ToDate(postOrderEntity.createdAt).toISOString(),
        updatedAt: iso8601ToDate(postOrderEntity.updatedAt).toISOString(),
      };
      posts.push(post);
    }
    const { postConfig, template } = await this.generatePostConfigAndTemplate(
      user,
      posts,
      siteConfigId,
    );
    //
    await this.addTask(
      postTaskEntity,
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS,
      template,
      postConfig,
    );
  }
  async getUserById(userId: number): Promise<UCenterUser> {
    throw new Error('Method not implemented.');
  }

  async addTask(
    workerTask: IWorkerTask,
    workerTaskMethod: MetaWorker.Enums.WorkerTaskMethod,
    template: MetaWorker.Info.Template,
    cfg: WorkerModel2Config,
  ) {
    if (!workerTaskMethod) {
      throw new BadRequestException('Worker task method must not be empty');
    }
    const jobDetail = await this.initMetaWorkerTasksJobDetail(
      workerTask,
      workerTaskMethod,
      template,
      cfg,
    );

    try {
      // const jobId = uuid();
      // const workerName = `meta-cms-worker-${workerNo}`;
      const { workerSecret } = workerTask;
      return await this.workerTasksQueue.add(jobDetail, {
        jobId: workerSecret,
      });
      // return await this.workerTasksJobProcessor.process(job);
    } catch (err) {
      this.logger.error(`Pipeline Exception: ${err}`, this.constructor.name);
      throw new InternalServerErrorException('Pipeline Exception');
    }
  }
  initMetaWorkerTasksJobDetail(
    workerTask: IWorkerTask,
    taskMethod: MetaWorker.Enums.WorkerTaskMethod,
    template: MetaWorker.Info.Template,
    cfg: WorkerModel2Config,
  ): WorkerTasksJobDetail {
    // const taskId = this.newTaskId(taskMethod);
    const { id: taskId, workerName } = workerTask;
    const task: MetaWorker.Info.Task = {
      taskId,
      taskMethod,
    };
    const taskConfig = {
      ...cfg,
      task,
    } as WorkerModel2TaskConfig;
    return {
      workerName,
      template,
      taskConfig,
    };
  }

  newTaskId(workerTaskMethod: MetaWorker.Enums.WorkerTaskMethod) {
    return `wt4site-${workerTaskMethod
      .toLowerCase()
      .replace('_', '-')}-${uuid()}`;
  }

  async getWorkerTaskById(
    auth: string,
    workerTaskId: string,
  ): Promise<WorkerModel2TaskConfig> {
    if (!auth) {
      throw new UnauthorizedException('Unauthorize');
    }

    const parts = auth.split(':');
    //workerName->base64 username,jobId->secret->base64 password
    const username = parts[0],
      jobId = parts[1];

    const job = await this.workerTasksQueue.getJob(jobId);
    if (
      job?.data?.workerName === username &&
      job?.data?.taskConfig?.task?.taskId === workerTaskId
    ) {
      return job?.data?.taskConfig;
    } else {
      throw new UnauthorizedException('Unauthorize');
    }
  }

  async report(
    auth: string,
    workerTaskId: string,
    taskReport: MetaWorker.Info.TaskReport<unknown>,
  ) {
    this.logger.verbose(
      `Worker ${workerTaskId} report ${taskReport.reason} reason on ${taskReport.timestamp}`,
      this.constructor.name,
    );
    const taskConfig = await this.getWorkerTaskById(auth, workerTaskId);
    const { taskMethod } = taskConfig.task;
    if (taskReport.reason === MetaWorker.Enums.TaskReportReason.HEALTH_CHECK) {
    } else if (
      taskReport.reason === MetaWorker.Enums.TaskReportReason.ERRORED
    ) {
      const internalResult = taskReport.data as MetaInternalResult<
        MetaWorker.Info.Post & Promise<Error>
      >;
      if (MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE === taskMethod) {
        // this.siteTasksLogicService.taskCallback();
        // event
      }
    }
  }
  async generateDeployConfigAndRepoEmpty(
    user: Partial<UCenterUser>,
    configId: number,
    validSiteStatus?: SiteStatus[],
  ): Promise<{
    deployConfig: MetaWorker.Configs.DeployConfig;
    repoEmpty: boolean;
  }> {
    this.logger.verbose(`Generate deploy config`, this.constructor.name);

    const { site, template, theme, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(
        user,
        configId,
        validSiteStatus,
      );

    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo, repoEmpty } =
      await this.storageService.generateMetaWorkerGitInfo(
        storageType,
        user.id,
        storageProviderId,
      );
    // console.log('gitInfo', gitInfo);
    const deployConfig: MetaWorker.Configs.DeployConfig = {
      user: {
        username: user.username,
        nickname: user.nickname,
      },
      site,
      template,
      theme,
      git: {
        storage: gitInfo,
      },
      gateway: this.configService.get('metaSpace.gateway'),
    };
    return {
      deployConfig,
      repoEmpty,
    };
  }

  public async generatePublishConfigAndTemplate(
    user: Partial<UCenterUser>,
    configId: number,
  ): Promise<{
    publisherType: MetaWorker.Enums.PublisherType;
    publishConfig: MetaWorker.Configs.PublishConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker site info`,
      this.constructor.name,
    );

    const { site, template, storage, publisher } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
      ]);

    const { publisherProviderId, publisherType } = publisher;

    if (!publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');
    const { gitInfo: publisherGitInfo, publishInfo } =
      await this.publisherService.generateMetaWorkerGitInfo(
        publisherType,
        user.id,
        publisherProviderId,
      );
    const { storageProviderId, storageType } = storage;
    const { gitInfo: storageGitInfo } =
      await this.storageService.getMetaWorkerGitInfo(
        storageType,
        user.id,
        storageProviderId,
      );
    const publishConfig: MetaWorker.Configs.PublishConfig = {
      site,
      git: {
        storage: storageGitInfo,
        publisher: publisherGitInfo,
      },
      publish: publishInfo,
    };

    return {
      publisherType,
      publishConfig,
      template,
    };
  }

  public async generatePostConfigAndTemplate(
    user: Partial<UCenterUser>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    configId: number,
  ): Promise<{
    postConfig: MetaWorker.Configs.PostConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker site info`,
      this.constructor.name,
    );

    const { site, template, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
      ]);
    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo } = await this.storageService.generateMetaWorkerGitInfo(
      storageType,
      user.id,
      storageProviderId,
    );
    const postConfig: MetaWorker.Configs.PostConfig = {
      user: {
        username: user.username,
        nickname: user.nickname,
      },
      site,
      post,
      git: {
        storage: gitInfo,
      },
    };
    return {
      postConfig,
      template,
    };
  }
}
