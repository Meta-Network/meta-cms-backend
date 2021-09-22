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
export class TasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly siteService: SiteService,
    private readonly storageService: StorageService,
    private readonly taskDispatchersService: TaskDispatchersService,
  ) {}

  async deploySite(user: any, siteConfigId: number): Promise<any> {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const { deployConfig, gitRepoSize } = await this.generateRepoAndDeployInfo(
      user,
      siteConfigId,
    );
    const taskSteps: MetaWorker.Enums.TaskMethod[] = [];

    this.logger.verbose(`Adding storage worker to queue`, TasksService.name);
    if (gitRepoSize > 0) {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    } else {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH);
    }

    const { templateType } = deployConfig.template;
    taskSteps.push(...this.getDeployTaskMethodsByTemplateType(templateType));

    taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH);
    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);

    const deploySiteTaskStepResults =
      (await this.taskDispatchersService.dispatchTask(
        taskSteps,
        deployConfig,
      )) as string[];

    const publishTaskSteps = [];
    const publishConfig: MetaWorker.Configs.PublishConfig = {
      site: deployConfig.site,
      git: deployConfig.git,
    };
    this.logger.verbose(`Adding publisher worker to queue`, TasksService.name);

    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
    );
    const publishSiteTaskStepResults = await this.doPublish(
      publishTaskSteps,
      publishConfig,
    );
    this.logger.verbose(`Adding DNS worker to queue`, TasksService.name);
    this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }

  protected getDeployTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG];
  }

  protected async doPublish(
    publishTaskSteps: MetaWorker.Enums.TaskMethod[],
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): Promise<string[]> {
    const publishSiteTaskStepResults =
      (await this.taskDispatchersService.dispatchTask(
        publishTaskSteps,
        publishConfig,
      )) as string[];
    return publishSiteTaskStepResults;
  }

  protected getPublishTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY];
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

  protected async generateRepoAndDeployInfo(
    user: any,
    configId: number,
  ): Promise<{
    deployConfig: MetaWorker.Configs.DeployConfig;
    gitRepoSize: number;
  }> {
    this.logger.verbose(`Generate meta worker user info`, TasksService.name);
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const { site, template, theme, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user.id, configId);

    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo, repoSize } =
      await this.storageService.generateMetaWorkerGitInfo(
        storageType,
        user.id,
        storageProviderId,
      );
    // console.log('gitInfo', gitInfo);
    const deployConfig: MetaWorker.Configs.DeployConfig = {
      user: userInfo,
      site,
      template,
      theme,
      git: gitInfo,
    };
    // for hexo update config
    deployConfig.site.domain = `https://${deployConfig.site.domain}`;
    return {
      deployConfig,
      gitRepoSize: repoSize,
    };
  }
}
