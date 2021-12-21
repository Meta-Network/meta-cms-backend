import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { ValidationException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { MetadataStorageType, SiteStatus } from '../../types/enum';
import { MetaSignatureHelper } from '../meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../meta-signature/meta-signature.service';
import { MetaNetworkService } from '../microservices/meta-network/meta-network.service';
import { DnsService } from '../provider/dns/dns.service';
import { PublisherService } from '../provider/publisher/publisher.service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { BaseTasksService } from './base.tasks.service';
import { TaskDispatchersService } from './workers/task-dispatchers.service';

@Injectable()
export class SiteTasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly baseService: BaseTasksService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly publisherService: PublisherService,
    private readonly taskDispatchersService: TaskDispatchersService,
    private readonly dnsService: DnsService,
    private readonly metaSignatureService: MetaSignatureService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
    private readonly metaNetworkService: MetaNetworkService,
  ) {}

  public async isSiteConfigTaskWorkspaceLocked(
    userId: number,
    siteConfigId: number,
  ) {
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

  public async deploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
  ): Promise<any> {
    await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
      siteConfigId,
    );

    return await this.doDeploySite(user, siteConfigId, { isLastTask: true });
  }

  public async publishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceRequestMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer?: string,
  ) {
    await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
      siteConfigId,
    );

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

  public async deployAndPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceRequestMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer?: string,
  ) {
    await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
      siteConfigId,
    );
    let authorPublishMetaSpaceServerVerificationMetadataRefer = '';
    if (authorPublishMetaSpaceRequestMetadataRefer) {
      const { authorPublishMetaSpaceServerVerificationMetadataRefer: refer } =
        await this.metaSignatureService.generateAndUploadPublishMetaSpaceServerVerificationMetadata(
          this.metaSignatureHelper.createPublishMetaSpaceVerificationKey(
            user.id,
            siteConfigId,
          ),
          authorPublishMetaSpaceRequestMetadataStorageType,
          authorPublishMetaSpaceRequestMetadataRefer,
        );
      authorPublishMetaSpaceServerVerificationMetadataRefer = refer;
    }

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

  private async doCheckoutForPublish(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceServerVerificationMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceServerVerificationMetadataRefer?: string,
  ) {
    const { deployConfig } =
      await this.baseService.generateDeployConfigAndRepoSize(
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
    this.logger.verbose(`Adding CICD worker to queue`, this.constructor.name);
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

  private async doDeploySite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    options?: {
      isLastTask?: boolean;
      authorPublishMetaSpaceServerVerificationMetadataStorageType?: MetadataStorageType;
      authorPublishMetaSpaceServerVerificationMetadataRefer?: string;
    },
  ) {
    this.logger.verbose(`Call doDeploySite`, this.constructor.name);
    const config = await this.siteConfigLogicService.getSiteConfigById(
      siteConfigId,
    );
    const oldSiteStatus = config.status; // store for rollback
    try {
      await this.siteConfigLogicService.updateSiteConfigStatus(
        siteConfigId,
        SiteStatus.Deploying,
      );
      const { deployConfig, repoEmpty } =
        await this.baseService.generateDeployConfigAndRepoSize(
          user,
          siteConfigId,
        );
      const taskSteps: MetaWorker.Enums.TaskMethod[] = [];
      this.setDeployConfigMetadata(
        deployConfig,
        options?.authorPublishMetaSpaceServerVerificationMetadataStorageType,
        options?.authorPublishMetaSpaceServerVerificationMetadataRefer,
      );
      this.logger.verbose(
        `Adding storage worker to queue`,
        this.constructor.name,
      );
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
      this.logger.verbose(`Adding CICD worker to queue`, this.constructor.name);

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
    } catch (error) {
      this.logger.error(
        `Call doDeploySite failed`,
        error,
        this.constructor.name,
      );
      await this.siteConfigLogicService.updateSiteConfigStatus(
        siteConfigId,
        oldSiteStatus,
      );
      throw error;
    }
  }

  private async doPublishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    options?: {
      isLastTask?: boolean;
    },
  ) {
    const { publisherType, publishConfig, template } =
      await this.baseService.generatePublishConfigAndTemplate(
        user,
        siteConfigId,
      );
    return await this.doPublish(
      user,
      template.templateType,
      publisherType,
      publishConfig,
      options,
    );
  }

  private async doPublish(
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
    // 有循环依赖，用事件来解决。事件发生内存泄漏问题，先换回直接调用的方式
    // this.eventEmitter.emit(TaskEvent.SITE_PUBLISHED, {
    //   user,
    //   publishConfig,
    // });
    // await this.postService.updatePostStateBySiteConfigId(
    //   PostState.SitePublished,
    //   publishConfig.site.configId,
    // );
    // this.logger.verbose(`Adding CDN worker to queue`, this.constructor.name);

    // notify Meta-Network-BE
    this.metaNetworkService.notifyMetaSpaceSiteCreated({
      ...publishConfig.site,
      userId: user.id,
    });
    return publishSiteTaskStepResults;
  }

  private async doUpdateDns(
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

  private setDeployConfigMetadata(
    deployConfig: MetaWorker.Configs.DeployConfig,
    authorPublishMetaSpaceServerVerificationMetadataStorageType: MetadataStorageType,
    authorPublishMetaSpaceServerVerificationMetadataRefer: string,
  ) {
    if (
      authorPublishMetaSpaceServerVerificationMetadataStorageType &&
      authorPublishMetaSpaceServerVerificationMetadataRefer
    ) {
      deployConfig.metadata = {
        authorPublishMetaSpaceServerVerificationMetadata: {
          storageType:
            authorPublishMetaSpaceServerVerificationMetadataStorageType,
          refer: authorPublishMetaSpaceServerVerificationMetadataRefer,
        },
      };
    }
  }

  // #region TaskMethods
  private getPublishTaskMethodsByPublisherType(
    publisherType: MetaWorker.Enums.PublisherType,
  ): MetaWorker.Enums.TaskMethod[] {
    if (MetaWorker.Enums.PublisherType.GITHUB === publisherType) {
      return [MetaWorker.Enums.TaskMethod.PUBLISH_GITHUB_PAGES];
    }
    throw new ValidationException(`Invalid publisher type: ${publisherType}`);
  }
  private getPublishTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      return [MetaWorker.Enums.TaskMethod.HEXO_GENERATE_DEPLOY];
    }
  }
  private getDeployTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_CONFIG];
    }
  }
  // #endregion TaskMethods
}
