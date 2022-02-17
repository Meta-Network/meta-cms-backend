import { MetaInternalResult } from '@metaio/microservice-model';
import { MetaWorker } from '@metaio/worker-model2';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ConflictException,
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

import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';
import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';
import { IWorkerTask } from '../../../entities/pipeline/worker-task.interface';
import { UCenterUser } from '../../../types';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
import {
  WorkerModel2Config,
  WorkerModel2TaskConfig,
  WorkModel2PostTaskResult,
} from '../../../types/worker-model2';
import { iso8601ToDate } from '../../../utils';
import { MetaUCenterService } from '../../microservices/meta-ucenter/meta-ucenter.service';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { SiteOrdersLogicService } from '../site-orders/site-orders.logic.service';
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
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly postTasksLogicService: PostTasksLogicService,
    private readonly siteOrdersLogicService: SiteOrdersLogicService,
    private readonly siteTasksLogicService: SiteTasksLogicService,
    @InjectQueue(WORKER_TASKS_JOB_PROCESSOR)
    private readonly workerTasksQueue: Queue<WorkerTasksJobDetail>,
    private readonly ucenterService: MetaUCenterService,
  ) {}

  async hasTaskInProgress(userId: number): Promise<boolean> {
    return (
      (await this.siteTasksLogicService.countUserDoingPublishSiteTask(userId)) >
        0 ||
      (await this.siteTasksLogicService.countUserDoingDeploySiteTask(userId)) >
        0 ||
      (await this.postTasksLogicService.countUserDoingPostTask(userId)) > 0
    );
  }

  async dispatchDeploySiteTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ): Promise<DeploySiteTaskEntity> {
    this.logger.verbose(
      `Dispatch deploy site task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );

    const { deploySiteTaskEntity, deploySiteOrderEntity } =
      await this.siteTasksLogicService.generateDeploySiteTask(
        siteConfigId,
        userId,
      );
    const user = await this.getUserInfo(userId);
    const { deployConfig } =
      await this.siteTasksLogicService.generateDeployConfigAndRepoEmpty(
        user,
        siteConfigId,
      );
    deploySiteTaskEntity.workerName = this.getWorkerName();
    deploySiteTaskEntity.workerSecret = this.newWorkerSecret();

    // Change task state to Doing & site state to Deploying
    await this.siteTasksLogicService.doingDeploySiteTask(deploySiteTaskEntity);
    await this.dispatchTask(
      deploySiteTaskEntity,
      MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE,
      deployConfig.template,
      deployConfig,
      autoFailed,
    );
    // 处理完成不在这里，而是在report待worker上报后一处理
    return deploySiteTaskEntity;
  }

  async dispatchCreatePostsTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ): Promise<PostTaskEntity> {
    this.logger.verbose(
      `Dispatch create posts task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );
    const { postTaskEntity, postOrderEntities } =
      await this.postTasksLogicService.generateUserPostTaskForPendingPosts(
        userId,
      );

    const user = await this.getUserInfo(userId);
    const posts = [];
    for (let i = 0; i < postOrderEntities.length; i++) {
      const postOrderEntity = postOrderEntities[i];
      const postMetaDataEntity = postOrderEntity.postMetadata;
      const post = {
        id: postMetaDataEntity.id,
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
      } as MetaWorker.Info.Post;
      posts.push(post);
    }
    const { postConfig, template } =
      await this.postTasksLogicService.generatePostConfigAndTemplate(
        user,
        posts,
        siteConfigId,
      );

    postTaskEntity.workerName = this.getWorkerName();
    postTaskEntity.workerSecret = this.newWorkerSecret();
    // Change task state to Doing
    await this.postTasksLogicService.doingPostTask(
      postTaskEntity,
      postOrderEntities,
    );
    await this.dispatchTask(
      postTaskEntity,
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS,
      template,
      postConfig,
      autoFailed,
    );
    return postTaskEntity;
  }

  getWorkerName() {
    return `meta-cms-worker-0-`;
  }
  newWorkerSecret(): string {
    return uuid();
  }

  async linkOrGeneratePublishSiteTask(siteConfigId: number, userId: number) {
    await this.siteTasksLogicService.linkOrGeneratePublishSiteTask(
      siteConfigId,
      userId,
    );
  }

  async dispatchPublishSiteTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ) {
    this.logger.verbose(
      `Dispatch publish site task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );
    const { publishSiteTaskEntity } =
      await this.siteTasksLogicService.getPendingPublishSiteTask(
        siteConfigId,
        userId,
      );
    if (PipelineOrderTaskCommonState.PENDING !== publishSiteTaskEntity?.state) {
      this.logger.warn(
        `Dispatch publish site task siteConfigId ${siteConfigId} userId ${userId}: invalid pubish site task state ${publishSiteTaskEntity?.state}`,
      );
      throw new ConflictException('Invalid publish site task state');
    }
    const user = await this.getUserInfo(publishSiteTaskEntity.userId);
    const { publishConfig, template } =
      await this.siteTasksLogicService.generatePublishConfigAndTemplate(
        user,
        siteConfigId,
      );
    publishSiteTaskEntity.workerName = this.getWorkerName();
    publishSiteTaskEntity.workerSecret = this.newWorkerSecret();
    // Change task state to Doing & site state to Deploying
    await this.siteTasksLogicService.doingPublishSiteTask(
      publishSiteTaskEntity,
    );
    await this.dispatchTask(
      publishSiteTaskEntity,
      MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE,
      template,
      publishConfig,
      autoFailed,
    );

    // 处理完成不在这里，由worker来调用finishTask/failTask
    return publishSiteTaskEntity;
  }

  async getUserInfo(userId: number): Promise<UCenterUser> {
    //TODO retry
    return await (
      await this.ucenterService.getUserInfo(userId)
    ).data;
  }

  async dispatchTask(
    workerTask: IWorkerTask,
    workerTaskMethod: MetaWorker.Enums.WorkerTaskMethod,
    template: MetaWorker.Info.Template,
    cfg: WorkerModel2Config,
    autoFailed?: boolean,
  ) {
    // console.log(cfg);
    if (!workerTaskMethod) {
      throw new BadRequestException('Worker task method must not be empty');
    }
    const jobDetail = await this.initMetaWorkerTasksJobDetail(
      workerTask,
      workerTaskMethod,
      template,
      cfg,
    );

    if (autoFailed) {
      await this.failTask(jobDetail.taskConfig);
    } else {
      try {
        // const jobId = uuid();
        // const workerName = `meta-cms-worker-${workerNo}`;
        const { workerSecret } = workerTask;
        // not including the actual execution time
        return await this.workerTasksQueue.add(jobDetail, {
          jobId: workerSecret,
        });
        // return await this.workerTasksJobProcessor.process(job);
      } catch (err) {
        this.logger.error(`Pipeline Exception: ${err}`, this.constructor.name);
        throw new InternalServerErrorException('Pipeline Exception');
      } finally {
        this.logger.verbose(`Dispatch task finished`, this.constructor.name);
      }
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
    this.logger.verbose(
      `Get worker task by id ${workerTaskId} auth ${auth}`,
      this.constructor.name,
    );
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
    if (MetaWorker.Enums.TaskReportReason.HEALTH_CHECK === taskReport.reason) {
      // 不需要做什么，有上面的输出日志就可以
    } else if (
      MetaWorker.Enums.TaskReportReason.FINISHED === taskReport.reason
    ) {
      // 无论是成功结束还是失败结束都会进入这里，并不需要特别做什么
    } else if (
      // 会用这个方式上报的是POST局部失败的情况
      MetaWorker.Enums.TaskReportReason.ERRORED === taskReport.reason
    ) {
      this.logger.verbose(
        `Worker ${workerTaskId} report ${taskReport.reason} reason on ${
          taskReport.timestamp
        } data: ${JSON.stringify(taskReport.data)}`,
        this.constructor.name,
      );
      if (
        MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
        MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
        MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
      ) {
        const internalResult =
          taskReport.data as MetaInternalResult<WorkModel2PostTaskResult>;
        this.postOrdersLogicService.failSubmitPost(
          internalResult.data.id as string,
        );
      }
    }
  }

  async finishTask(taskConfig: WorkerModel2TaskConfig) {
    this.logger.verbose(
      `Finish task taskMethod ${taskConfig.task.taskMethod} taskId ${taskConfig.task.taskId} siteConfigId ${taskConfig.site.configId} `,
      this.constructor.name,
    );
    const { taskMethod } = taskConfig.task;
    if (MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE === taskMethod) {
      await this.siteTasksLogicService.finishDeploySiteTask(
        taskConfig.task.taskId,
      );
    } else if (
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
    ) {
      const postTaskEntity = await this.postTasksLogicService.getById(
        taskConfig.task.taskId,
      );
      // let publishSiteOrderId;
      // if (taskConfig.site.enableAutoPublish) {
      const publishSiteOrderEntity =
        await this.siteOrdersLogicService.generatePublishSiteOrder(
          postTaskEntity.userId,
        );
      const publishSiteOrderId = publishSiteOrderEntity.id;
      // }
      await this.postTasksLogicService.finishPostTask(
        taskConfig.task.taskId,
        publishSiteOrderId,
      );
    } else if (MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE === taskMethod) {
      await this.siteTasksLogicService.finishPublishSiteTask(
        taskConfig as MetaWorker.Configs.PublishTaskConfig,
      );
    }
    //TODO 异步拉动下一个任务
  }
  async failTask(taskConfig: WorkerModel2TaskConfig) {
    this.logger.error(
      `Fail task taskMethod ${taskConfig.task.taskMethod} taskId ${taskConfig.task.taskId} siteConfigId ${taskConfig.site.configId} `,
      this.constructor.name,
    );
    const { taskMethod } = taskConfig.task;
    if (MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE === taskMethod) {
      await this.siteTasksLogicService.failDeploySiteTask(
        taskConfig.task.taskId,
      );
    } else if (
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
    ) {
      await this.postTasksLogicService.failPostTask(taskConfig.task.taskId);
    } else if (MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE === taskMethod) {
      await this.siteTasksLogicService.failPublishSiteTask(
        taskConfig.task.taskId,
      );
    }
    //TODO 异步拉动下一个任务
  }
}
