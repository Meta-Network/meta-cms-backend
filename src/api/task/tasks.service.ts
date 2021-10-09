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
import { UCenterJWTPayload } from '../../types';
import { SiteStatus } from '../../types/enum';
import { MetaNetworkService } from '../microservices/meta-network/meta-network.service';
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
    private readonly metaNetworkService: MetaNetworkService,
  ) {}

  async deploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ): Promise<any> {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);

    return await this.doDeploySite(user, siteConfigId);
  }
  async deployAndPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const deploySiteTaskStepResults = await this.doDeploySite(
      user,
      siteConfigId,
    );
    const publishSiteTaskStepResults = await this.doPublishSite(
      user,
      siteConfigId,
    );
    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }
  async publishSite(user: Partial<UCenterJWTPayload>, siteConfigId: number) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const deploySiteTaskStepResults = await this.doCheckoutForPublish(
      user,
      siteConfigId,
    );
    const publishSiteTaskStepResults = await this.doPublishSite(
      user,
      siteConfigId,
    );
    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }

  async createPost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const deploySiteTaskStepResults = await this.doCheckoutForPublish(
      user,
      siteConfigId,
    );
    const createPostTaskStepResults = await this.doCreatePost(
      user,
      post,
      siteConfigId,
    );
    return Object.assign(deploySiteTaskStepResults, createPostTaskStepResults);
  }

  async updatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const deploySiteTaskStepResults = await this.doCheckoutForPublish(
      user,
      siteConfigId,
    );
    const createPostTaskStepResults = await this.doCreatePost(
      user,
      post,
      siteConfigId,
    );
    return Object.assign(deploySiteTaskStepResults, createPostTaskStepResults);
  }

  protected async doCheckoutForPublish(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ) {
    const { deployConfig } = await this.generateDeployConfigAndRepoSize(
      user,
      siteConfigId,
      [SiteStatus.Deployed, SiteStatus.Publishing, SiteStatus.Published],
    );
    const deployTaskSteps: MetaWorker.Enums.TaskMethod[] = [];
    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);
    deployTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);

    return await this.taskDispatchersService.dispatchTask(
      deployTaskSteps,
      deployConfig,
    );
  }
  protected getPublishTaskMethodsByPublisherType(
    publisherType: MetaWorker.Enums.PublisherType,
  ): MetaWorker.Enums.TaskMethod[] {
    if (MetaWorker.Enums.PublisherType.GITHUB === publisherType) {
      return [MetaWorker.Enums.TaskMethod.PUBLISH_GITHUB_PAGES];
    }
    throw new ValidationException(`invalid publisher type: ${publisherType}`);
  }
  protected async doDeploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ) {
    await this.siteConfigLogicService.updateSiteConfigStatus(
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
    await this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deployed,
    );
    return deploySiteTaskStepResults;
  }

  protected async doPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ) {
    const { publisherType, publishConfig, template } =
      await this.generatePublishConfigAndTemplate(user, siteConfigId);
    return await this.doPublish(
      user,
      template.templateType,
      publisherType,
      publishConfig,
    );
  }

  protected async doPublish(
    user: Partial<UCenterJWTPayload>,
    templateType: MetaWorker.Enums.TemplateType,
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    this.logger.verbose(
      `Adding publisher worker to queue`,
      this.constructor.name,
    );
    const publishTaskSteps = [];

    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
      ...this.getPublishTaskMethodsByPublisherType(publisherType),
    );
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishConfig.site.configId,
      SiteStatus.Publishing,
    );
    const publishSiteTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        publishTaskSteps,
        publishConfig,
      );

    await this.doUpdateDns(publisherType, publishConfig);
    await this.publisherService.updateDomainName(publisherType, publishConfig);
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishConfig.site.configId,
      SiteStatus.Published,
    );
    // this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    // notify Meta-Network-BE
    this.metaNetworkService.notifyMetaSpaceSiteCreated({
      ...publishConfig.site,
      userId: user.id,
    });
    return publishSiteTaskStepResults;
  }

  protected async doCreatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
  ) {
    const { postConfig, template } = await this.generatePostConfigAndTemplate(
      user,
      post,
      siteConfigId,
    );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding post creator worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getCreatePostTaskMethodsByTemplateType(templateType),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
    );
  }

  protected async doUpdatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
  ) {
    const { postConfig, template } = await this.generatePostConfigAndTemplate(
      user,
      post,
      siteConfigId,
    );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding post updater worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getUpdatePostTaskMethodsByTemplateType(templateType),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
    );
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
    user: Partial<UCenterJWTPayload>,
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

  protected async generatePostConfigAndTemplate(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
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
    const postConfig: MetaWorker.Configs.PostConfig = {
      user: {
        username: user.username,
        nickname: user.nickname,
      },
      site,
      post,
      git: gitInfo,
    };
    return {
      postConfig,
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

  protected getCreatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_CREATE_POST];
  }
  protected getUpdatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_POST];
  }

  protected async generateDeployConfigAndRepoSize(
    user: any,
    configId: number,
    validSiteStatus?: SiteStatus[],
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
      await this.siteService.generateMetaWorkerSiteInfo(
        user.id,
        configId,
        validSiteStatus,
      );

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
