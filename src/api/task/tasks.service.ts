import { MetaWorker } from '@metaio/worker-model';
import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { DataNotFoundException, ValidationException } from '../../exceptions';
import { SiteStatus } from '../../types/enum';
import { StorageService } from '../provider/storage/service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { SiteService } from '../site/service';
import { DnsWorkersService } from './workers/dns/dns-workers.service';
import { DnsRecordType } from './workers/dns/provider/dns.provider';
import { PublisherWorkersService } from './workers/publisher/publisher-workers.service';
import { TaskDispatchersService } from './workers/task-dispatchers.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly siteService: SiteService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly storageService: StorageService,
    private readonly taskDispatchersService: TaskDispatchersService,
    private readonly dnsWorkersService: DnsWorkersService,
    private readonly publisherWorkersService: PublisherWorkersService,
  ) {}

  async deploySite(user: any, siteConfigId: number): Promise<any> {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deploying,
    );
    const { deployConfig, gitRepoSize } =
      await this.generateDeployConfigAndRepoSize(user, siteConfigId);
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
    this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deployed,
    );
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

    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }
  getTargetDomain(publishConfig: MetaWorker.Configs.PublishConfig): string {
    return this.publisherWorkersService.getTargetOriginDomain(publishConfig);
  }

  async publishSite(user: any, siteConfigId: number) {
    const { publishConfig, template } =
      await this.generatePublishConfigAndTemplate(user, siteConfigId);
    const templateType = template.templateType;
    const publishTaskSteps = [];
    publishTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    this.logger.verbose(`Adding publisher worker to queue`, TasksService.name);

    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
    );
    return await this.doPublish(publishTaskSteps, publishConfig);
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
    // default publisher type
    console.log(publishConfig.site.publisherType);
    if (
      publishConfig.site.publisherType === undefined ||
      publishConfig.site.publisherType === null
    ) {
      publishConfig.site.publisherType = MetaWorker.Enums.PublisherType.GITHUB;
    } else {
      publishConfig.site.publisherType =
        MetaWorker.Enums.PublisherType[publishConfig.site.publisherType];
    }
    this.siteConfigLogicService.updateSiteConfigStatus(
      publishConfig.site.configId,
      SiteStatus.Publishing,
    );
    const publishSiteTaskStepResults =
      (await this.taskDispatchersService.dispatchTask(
        publishTaskSteps,
        publishConfig,
      )) as string[];
    this.siteConfigLogicService.updateSiteConfigStatus(
      publishConfig.site.configId,
      SiteStatus.Published,
    );
    await this.doUpdateDns(publishConfig);
    await this.doUpdatePublisherDomainName(publishConfig);
    // this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    //TODO notify Meta-Network-BE
    return publishSiteTaskStepResults;
  }
  protected async doUpdatePublisherDomainName(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    this.logger.verbose(`Adding Publisher worker to queue`, TasksService.name);

    await this.publisherWorkersService.updateDomainName(publishConfig);
  }

  protected async doUpdateDns(publishConfig: MetaWorker.Configs.PublishConfig) {
    this.logger.verbose(`Adding DNS worker to queue`, TasksService.name);
    const dnsRecord = {
      type: DnsRecordType.CNAME,
      name: publishConfig.site.metaSpacePrefix,
      content: this.getTargetDomain(publishConfig),
    };
    await this.dnsWorkersService.updateDnsRecord(dnsRecord);
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

  protected async generateDeployConfigAndRepoSize(
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

  protected async generatePublishConfigAndTemplate(
    user: any,
    configId: number,
  ): Promise<{
    publishConfig: MetaWorker.Configs.PublishConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(`Generate meta worker user info`, TasksService.name);
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

    const { site, template, theme, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user.id, configId, [
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
    const publishConfig: MetaWorker.Configs.PublishConfig = {
      site,
      git: gitInfo,
    };

    return {
      publishConfig,
      template,
    };
  }
}
