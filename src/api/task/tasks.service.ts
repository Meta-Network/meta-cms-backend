import { MetaWorker } from '@metaio/worker-model';
import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { DataNotFoundException } from '../../exceptions';
import { StorageService } from '../provider/storage/service';
import { SiteService } from '../site/service';
import { TaskDispatchersService } from './workers/task-dispatchers.service';

@Injectable()
export class Tasks2Service {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly siteService: SiteService,
    private readonly storageService: StorageService,
    private readonly taskDispatchersService: TaskDispatchersService,
  ) {}

  async deploySite(user: any, siteConfigId: number): Promise<any> {
    const { deployConfig, repoSize } = await this.generateRepoAndDeployInfo(
      user,
      siteConfigId,
    );
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const taskSteps = [] as MetaWorker.Enums.TaskMethod[];

    this.logger.verbose(`Adding storage worker to queue`, Tasks2Service.name);
    if (repoSize > 0) {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    } else {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH);
    }
    taskSteps.push(
      ...[
        MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG,
        MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH,
      ],
    );

    this.logger.verbose(`Adding CICD worker to queue`, Tasks2Service.name);

    const deploySiteTaskStepResults =
      (await this.taskDispatchersService.dispatchTask(
        taskSteps,
        deployConfig,
      )) as string[];

    const publishTaskSteps = [];
    const publishConfig = {} as MetaWorker.Configs.PublishConfig;
    const publishSiteTaskStepResults = await this.doPublish(
      publishTaskSteps,
      publishConfig,
    );
    return [...deploySiteTaskStepResults, ...publishSiteTaskStepResults];
  }

  protected async doPublish(
    publishTaskSteps: any[],
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): Promise<string[]> {
    this.logger.verbose(`Adding publisher worker to queue`, Tasks2Service.name);
    publishTaskSteps.push(MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY);
    this.logger.verbose(`Adding DNS worker to queue`, Tasks2Service.name);
    this.logger.verbose(`Adding CDN worker to queue`, Tasks2Service.name);

    const publishSiteTaskStepResults =
      (await this.taskDispatchersService.dispatchTask(
        publishTaskSteps,
        publishConfig,
      )) as string[];
    return publishSiteTaskStepResults;
  }

  protected async checkSiteConfigTaskWorkspace(siteConfigId: number) {
    // check task workspace is existed

    if (
      await this.taskDispatchersService.tryGetSiteConfigTaskWorkspaceLock(
        siteConfigId,
      )
    ) {
      throw new ConflictException(
        `Task workspace is existed:  site config ${siteConfigId}`,
      );
    }
  }

  protected async generateRepoAndDeployInfo(user: any, cid: number) {
    this.logger.verbose(`Generate meta worker user info`, Tasks2Service.name);
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const { siteInfo, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user.id, cid);

    const { sId, sType } = storage;
    if (!sId) throw new DataNotFoundException('storage provider id not found');
    const { gitInfo, repoSize } =
      await this.storageService.generateMetaWorkerGitInfo(sType, user.id, sId);

    const deployConfig: MetaWorker.Configs.DeployConfig = {
      ...userInfo,
      ...siteInfo,
      ...gitInfo,
    };
    return {
      deployConfig,
      repoSize,
    };
  }
}
