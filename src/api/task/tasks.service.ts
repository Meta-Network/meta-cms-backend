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
import { DnsService } from '../provider/dns/dns.service';
import { PublisherService } from '../provider/publisher/publisher.service';
import { StorageService } from '../provider/storage/service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { SiteService } from '../site/service';
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
    private readonly publisherService: PublisherService,
    private readonly taskDispatchersService: TaskDispatchersService,
    private readonly dnsService: DnsService,
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
      await this.taskDispatchersService.dispatchTask(taskSteps, deployConfig);
    this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deployed,
    );
    this.logger.verbose(`Adding publisher worker to queue`, TasksService.name);
    const publishTaskSteps = [];
    const { publisherType, publishConfig } =
      await this.generatePublishConfigAndTemplate(user, siteConfigId);

    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
      ...this.getPublishTaskMethodsByPublisherType(publisherType),
    );
    const publishSiteTaskStepResults = await this.doPublish(
      publishTaskSteps,
      publisherType,
      publishConfig,
    );

    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }
  async publishSite(user: any, siteConfigId: number) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Publishing,
    );
    const { deployConfig } = await this.generateDeployConfigAndRepoSize(
      user,
      siteConfigId,
    );
    const deployTaskSteps: MetaWorker.Enums.TaskMethod[] = [];
    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);
    // if (gitRepoSize > 0) {
    deployTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    // } else {
    //   deployTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH);
    // }
    const deploySiteTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        deployTaskSteps,
        deployConfig,
      );
    this.logger.verbose(
      `Adding publisher worker to queue`,
      this.constructor.name,
    );

    const { publisherType, publishConfig, template } =
      await this.generatePublishConfigAndTemplate(user, siteConfigId);
    const templateType = template.templateType;
    const publishTaskSteps = [];

    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
      ...this.getPublishTaskMethodsByPublisherType(publisherType),
    );
    const publishSiteTaskStepResults = await this.doPublish(
      publishTaskSteps,
      publisherType,
      publishConfig,
    );
    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }
  getPublishTaskMethodsByPublisherType(
    publisherType: MetaWorker.Enums.PublisherType,
  ): MetaWorker.Enums.TaskMethod[] {
    if (MetaWorker.Enums.PublisherType.GITHUB === publisherType) {
      return [MetaWorker.Enums.TaskMethod.PUBLISH_GITHUB_PAGES];
    }
    throw new ValidationException(`invalid publisher type: ${publisherType}`);
  }

  protected async doPublish(
    publishTaskSteps: MetaWorker.Enums.TaskMethod[],
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): Promise<string[]> {
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
    await this.doUpdateDns(publisherType, publishConfig);
    await this.publisherService.updateDomainName(publisherType, publishConfig);
    // this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    //TODO notify Meta-Network-BE
    return publishSiteTaskStepResults;
  }

  protected async doUpdateDns(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    this.logger.verbose(`Adding DNS worker to queue`, this.constructor.name);
    const dnsRecord = {
      type: MetaWorker.Enums.DnsRecordType.CNAME,
      name: publishConfig.site.metaSpacePrefix,
      content: this.publisherService.getTargetOriginDomain(
        publisherType,
        publishConfig,
      ),
    };
    await this.dnsService.updateDnsRecord(dnsRecord);
  }

  protected getPublishTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY];
  }

  protected async generatePublishConfigAndTemplate(
    user: any,
    configId: number,
  ): Promise<{
    publisherType: MetaWorker.Enums.PublisherType;
    publishConfig: MetaWorker.Configs.PublishConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker user info`,
      this.constructor.name,
    );

    const { site, template, theme, publisher } =
      await this.siteService.generateMetaWorkerSiteInfo(user.id, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
      ]);

    const { publisherProviderId, publisherType } = publisher;

    if (!publisherProviderId)
      throw new DataNotFoundException('publisher provider id not found');
    const { gitInfo, publishInfo } =
      await this.publisherService.generateMetaWorkerGitInfo(
        publisherType,
        user.id,
        publisherProviderId,
      );
    const publishConfig: MetaWorker.Configs.PublishConfig = {
      site,
      git: gitInfo,
      publish: publishInfo,
    };

    return {
      publisherType,
      publishConfig,
      template,
    };
  }

  protected getDeployTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG];
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
    // deployConfig.site.domain = `https://${deployConfig.site.domain}`;
    return {
      deployConfig,
      gitRepoSize: repoSize,
    };
  }
}
