import { MetaWorker } from '@metaio/worker-model';
import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isNotEmpty } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskEvent } from '../../constants';
import { DataNotFoundException, ValidationException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { MetadataStorageType, SiteStatus } from '../../types/enum';
import { MetaSignatureHelper } from '../meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../meta-signature/meta-signature.service';
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
    private readonly metaSignatureService: MetaSignatureService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async isSiteConfigTaskWorkspaceLocked(userId: number, siteConfigId: number) {
    await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    const taskWorkspace =
      await this.taskDispatchersService.tryGetSiteConfigTaskWorkspaceLock(
        siteConfigId,
      );

    return isNotEmpty(taskWorkspace);
  }

  async deploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ): Promise<any> {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);

    return await this.doDeploySite(user, siteConfigId, { isLastTask: true });
  }
  async deployAndPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceRequestMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer?: string,
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    const { authorPublishMetaSpaceServerVerificationMetadataRefer } =
      await this.metaSignatureService.generateAndUploadPublishMetaSpaceServerVerificationMetadata(
        this.metaSignatureHelper.createPublishMetaSpaceVerificationKey(
          user.id,
          siteConfigId,
        ),
        authorPublishMetaSpaceRequestMetadataStorageType,
        authorPublishMetaSpaceRequestMetadataRefer,
      );
    //TODO 写合约，记录生成 authorPublishMetaSpaceServerVerificationMetadata 的时间戳
    const deploySiteTaskStepResults = await this.doDeploySite(
      user,
      siteConfigId,
      {
        isLastTask: false,
        authorPublishMetaSpaceServerVerificationMetadataStorageType:
          authorPublishMetaSpaceRequestMetadataStorageType,
        authorPublishMetaSpaceServerVerificationMetadataRefer,
      },
    );
    const publishSiteTaskStepResults = await this.doPublishSite(
      user,
      siteConfigId,
      {
        isLastTask: true,
      },
    );
    return Object.assign(deploySiteTaskStepResults, publishSiteTaskStepResults);
  }
  async publishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceRequestMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer?: string,
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);

    const prepublisheSiteTaskStepResults = await this.doCheckoutForPublish(
      user,
      siteConfigId,
      authorPublishMetaSpaceRequestMetadataStorageType,
      authorPublishMetaSpaceRequestMetadataRefer,
    );

    const publishSiteTaskStepResults = await this.doPublishSite(
      user,
      siteConfigId,
      {
        isLastTask: true,
      },
    );
    return Object.assign(
      prepublisheSiteTaskStepResults,
      publishSiteTaskStepResults,
    );
  }

  async createPost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    return await this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doCreatePost(user, post, siteConfigId, options),
      options,
    );
  }

  async updatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
    options?: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    return await this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doUpdatePost(user, post, siteConfigId, options),
      options,
    );
  }

  async publishDraft(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
    options?: {
      isLastTask: boolean;
    },
  ) {
    await this.checkSiteConfigTaskWorkspace(siteConfigId);
    return await this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doPublishDraft(user, post, siteConfigId),
      options,
    );
  }

  protected async doCheckoutForPublish(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceServerVerificationMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceServerVerificationMetadataRefer?: string,
  ) {
    const { deployConfig } = await this.generateDeployConfigAndRepoSize(
      user,
      siteConfigId,
      [SiteStatus.Deployed, SiteStatus.Publishing, SiteStatus.Published],
    );
    this.setDeployConfigMetadata(
      deployConfig,
      authorPublishMetaSpaceServerVerificationMetadataStorageType,
      authorPublishMetaSpaceServerVerificationMetadataRefer,
    );

    const deployTaskSteps: MetaWorker.Enums.TaskMethod[] = [];
    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);
    deployTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    if (
      authorPublishMetaSpaceServerVerificationMetadataStorageType &&
      authorPublishMetaSpaceServerVerificationMetadataRefer
    ) {
      deployTaskSteps.push(
        MetaWorker.Enums.TaskMethod.GENERATE_METASPACE_CONFIG,
      );
      deployTaskSteps.push(MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH);
    }
    return await this.taskDispatchersService.dispatchTask(
      deployTaskSteps,
      deployConfig,
    );
  }
  setDeployConfigMetadata(
    deployConfig: MetaWorker.Configs.DeployConfig,
    authorPublishMetaSpaceServerVerificationMetadataStorageType: MetadataStorageType,
    authorPublishMetaSpaceServerVerificationMetadataRefer: string,
  ) {
    deployConfig.metadata = {
      authorPublishMetaSpaceServerVerificationMetadata: {
        storageType:
          authorPublishMetaSpaceServerVerificationMetadataStorageType,
        refer: authorPublishMetaSpaceServerVerificationMetadataRefer,
      },
    };
  }

  protected async doCheckoutCommitPush(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    dispatchTaskFunc: () => Promise<any>,
    options?: {
      isLastTask: boolean;
    },
  ) {
    const { deployConfig } = await this.generateDeployConfigAndRepoSize(
      user,
      siteConfigId,
      [SiteStatus.Deployed, SiteStatus.Publishing, SiteStatus.Published],
    );
    const checkoutTaskSteps: MetaWorker.Enums.TaskMethod[] = [
      MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT,
    ];
    this.logger.verbose(`Adding checkout worker to queue`, TasksService.name);

    const checkoutTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        checkoutTaskSteps,
        deployConfig,
        //必定不是最后一个任务，这里不能退出
      );

    const commitPushTaskSteps: MetaWorker.Enums.TaskMethod[] = [
      MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH,
    ];
    const taskStepResults = await dispatchTaskFunc();
    this.logger.verbose(
      `Adding commit&push worker to queue`,
      TasksService.name,
    );

    const commitPushTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        commitPushTaskSteps,
        deployConfig,
        options?.isLastTask,
      );
    return Object.assign(
      checkoutTaskStepResults,
      taskStepResults,
      commitPushTaskStepResults,
    );
  }
  protected getPublishTaskMethodsByPublisherType(
    publisherType: MetaWorker.Enums.PublisherType,
  ): MetaWorker.Enums.TaskMethod[] {
    if (MetaWorker.Enums.PublisherType.GITHUB === publisherType) {
      return [MetaWorker.Enums.TaskMethod.PUBLISH_GITHUB_PAGES];
    }
    throw new ValidationException(`Invalid publisher type: ${publisherType}`);
  }
  protected async doDeploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    options?: {
      isLastTask?: boolean;
      authorPublishMetaSpaceServerVerificationMetadataStorageType?: MetadataStorageType;
      authorPublishMetaSpaceServerVerificationMetadataRefer?: string;
    },
  ) {
    await this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deploying,
    );
    const { deployConfig, repoEmpty } =
      await this.generateDeployConfigAndRepoSize(user, siteConfigId);
    const taskSteps: MetaWorker.Enums.TaskMethod[] = [];
    this.setDeployConfigMetadata(
      deployConfig,
      options?.authorPublishMetaSpaceServerVerificationMetadataStorageType,
      options?.authorPublishMetaSpaceServerVerificationMetadataRefer,
    );
    this.logger.verbose(`Adding storage worker to queue`, TasksService.name);
    if (repoEmpty) {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_INIT_PUSH);
    } else {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT);
    }

    const { templateType } = deployConfig.template;
    taskSteps.push(...this.getDeployTaskMethodsByTemplateType(templateType));

    taskSteps.push(MetaWorker.Enums.TaskMethod.GENERATE_METASPACE_CONFIG);
    taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH);
    if (!options?.isLastTask) {
      taskSteps.push(MetaWorker.Enums.TaskMethod.GIT_OVERWRITE_THEME);
    }
    this.logger.verbose(`Adding CICD worker to queue`, TasksService.name);

    const deploySiteTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        taskSteps,
        deployConfig,
        options?.isLastTask,
      );
    await this.siteConfigLogicService.updateSiteConfigStatus(
      siteConfigId,
      SiteStatus.Deployed,
    );
    return deploySiteTaskStepResults;
  }

  protected async doPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    options?: {
      isLastTask?: boolean;
    },
  ) {
    const { publisherType, publishConfig, template } =
      await this.generatePublishConfigAndTemplate(user, siteConfigId);
    return await this.doPublish(
      user,
      template.templateType,
      publisherType,
      publishConfig,
      options,
    );
  }

  protected async doPublish(
    user: Partial<UCenterJWTPayload>,
    templateType: MetaWorker.Enums.TemplateType,
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
    options?: {
      isLastTask?: boolean;
    },
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
        options?.isLastTask,
      );

    await this.doUpdateDns(publisherType, publishConfig);
    await this.publisherService.updateDomainName(publisherType, publishConfig);
    // 更新状态和最后一次发布时间
    await this.siteConfigLogicService.setPublished(publishConfig.site.configId);
    // 有循环依赖，用事件来解决
    this.eventEmitter.emit(TaskEvent.SITE_PUBLISHED, {
      user,
      publishConfig,
    });
    // await this.postService.updatePostStateBySiteConfigId(
    //   PostState.SitePublished,
    //   publishConfig.site.configId,
    // );
    // this.logger.verbose(`Adding CDN worker to queue`, TasksService.name);

    // notify Meta-Network-BE
    // this.metaNetworkService.notifyMetaSpaceSiteCreated({
    //   ...publishConfig.site,
    //   userId: user.id,
    // });
    return publishSiteTaskStepResults;
  }

  protected async doCreatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft?: boolean;
    },
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
      ...this.getCreatePostTaskMethodsByTemplateType(
        templateType,
        options?.isDraft,
      ),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
      // 必定不是最后一个任务
    );
  }

  protected async doUpdatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post,
    siteConfigId: number,
    options?: {
      isDraft?: boolean;
    },
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
      ...this.getUpdatePostTaskMethodsByTemplateType(
        templateType,
        options?.isDraft,
      ),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
      // 必定不是最后一个任务
    );
  }

  protected async doPublishDraft(
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
      `Adding publish draft worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getPublishDraftTaskMethodsByTemplateType(templateType),
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

    const { site, template, theme, storage, publisher } =
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

  protected async generatePostConfigAndTemplate(
    user: Partial<UCenterJWTPayload>,
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

  protected getDeployTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG];
  }

  protected async checkSiteConfigTaskWorkspace(
    siteConfigId: number,
    taskWorkspaceInUse?: string,
  ) {
    // check task workspace is existed
    const taskWorkspace =
      await this.taskDispatchersService.tryGetSiteConfigTaskWorkspaceLock(
        siteConfigId,
      );
    if (taskWorkspace && taskWorkspace !== taskWorkspaceInUse) {
      throw new ConflictException(
        `Task workspace is existed:  site config ${siteConfigId}`,
      );
    }
  }

  protected getCreatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
    draftFlag = false,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      if (draftFlag) {
        return [MetaWorker.Enums.TaskMethod.HEXO_CREATE_DRAFT];
      }
      return [MetaWorker.Enums.TaskMethod.HEXO_CREATE_POST];
    }
  }
  protected getUpdatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
    draftFlag = false,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      if (draftFlag) {
        return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_DRAFT];
      }
      return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_POST];
    }
  }

  protected getPublishDraftTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      return [MetaWorker.Enums.TaskMethod.HEXO_PUBLISH_DRAFT];
    }
  }

  protected async generateDeployConfigAndRepoSize(
    user: Partial<UCenterJWTPayload>,
    configId: number,
    validSiteStatus?: SiteStatus[],
  ): Promise<{
    deployConfig: MetaWorker.Configs.DeployConfig;
    repoEmpty: boolean;
  }> {
    this.logger.verbose(`Generate meta worker user info`, TasksService.name);
    const userInfo: MetaWorker.Info.UCenterUser = {
      username: user.username,
      nickname: user.nickname,
    };

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
      user: userInfo,
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
}
