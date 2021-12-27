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
    return await this.doDeploySite(user, siteConfigId, { isLastTask: true });
  }

  public async publishSite(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    authorPublishMetaSpaceRequestMetadataStorageType?: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer?: string,
  ) {
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
    this.logger.verbose(`Call doCheckoutForPublish`, this.constructor.name);
    // Get deploy config and sign metadata
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
    // Build task steps
    const deployTaskSteps: MetaWorker.Enums.TaskMethod[] = [];
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
    // Run task
    this.logger.verbose(`Adding CICD worker to queue`, this.constructor.name);
    await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
      siteConfigId,
    );
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
    const originalState = config.status; // store original state for rollback
    try {
      // Get deploy config and sign metadata
      const { deployConfig, repoEmpty } =
        await this.baseService.generateDeployConfigAndRepoSize(
          user,
          siteConfigId,
        );
      this.setDeployConfigMetadata(
        deployConfig,
        options?.authorPublishMetaSpaceServerVerificationMetadataStorageType,
        options?.authorPublishMetaSpaceServerVerificationMetadataRefer,
      );
      // Build task steps
      this.logger.verbose(
        `Adding storage worker to queue`,
        this.constructor.name,
      );
      const taskSteps: MetaWorker.Enums.TaskMethod[] = [];
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
      // Change site state to Deploying
      await this.siteConfigLogicService.updateSiteConfigStatus(
        siteConfigId,
        SiteStatus.Deploying,
      );
      // Run task
      this.logger.verbose(`Adding CICD worker to queue`, this.constructor.name);
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
      const deploySiteTaskStepResults =
        await this.taskDispatchersService.dispatchTask(
          taskSteps,
          deployConfig,
          options?.isLastTask,
        );
      // Change site state to Deployed
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
        originalState,
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
    // Get publisher config
    const { publisherType, publishConfig, template } =
      await this.baseService.generatePublishConfigAndTemplate(
        user,
        siteConfigId,
      );
    const { templateType } = template;
    // Build task steps
    this.logger.verbose(
      `Adding publisher worker to queue`,
      this.constructor.name,
    );
    const publishTaskSteps = [];
    publishTaskSteps.push(
      ...this.getPublishTaskMethodsByTemplateType(templateType),
      ...this.getPublishTaskMethodsByPublisherType(publisherType),
    );
    // Change site state to Publishing
    const config = await this.siteConfigLogicService.updateSiteConfigStatus(
      publishConfig.site.configId,
      SiteStatus.Publishing,
    );
    // Run task
    this.logger.verbose(`Adding CICD worker to queue`, this.constructor.name);
    await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
      config.id,
    );
    const publishSiteTaskStepResults =
      await this.taskDispatchersService.dispatchTask(
        publishTaskSteps,
        publishConfig,
        options?.isLastTask,
      );
    // Update DNS record
    await this.doUpdateDns(publisherType, publishConfig);
    await this.publisherService.updateDomainName(publisherType, publishConfig);
    // notify Meta-Network-BE
    if (Number.isNaN(config.lastPublishedAt.getTime())) {
      this.metaNetworkService.notifyMetaSpaceSiteCreated({
        ...publishConfig.site,
        userId: user.id,
      });
    } else {
      this.metaNetworkService.notifyMetaSpaceSitePublished({
        ...publishConfig.site,
        userId: user.id,
      });
    }
    // Change site state to Published
    await this.siteConfigLogicService.setPublished(config.id);
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
