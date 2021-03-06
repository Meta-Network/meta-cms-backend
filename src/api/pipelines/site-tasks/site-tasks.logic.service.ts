import { MetaWorker } from '@metaio/worker-model2';
import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';
import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { DataNotFoundException } from '../../../exceptions';
import { UCenterUser } from '../../../types';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import { MetaNetworkService } from '../../microservices/meta-network/meta-network.service';
import { WorkerModel2DnsService } from '../../provider/dns/worker-model2.dns.service';
import { WorkerModel2PublisherService } from '../../provider/publisher/worker-model2.publisher.service';
import { WorkerModel2StorageService } from '../../provider/storage/worker-model2.service';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { WorkerModel2SiteService } from '../../site/worker-model2.service';
import {
  LINK_OR_GENERATE_PUBLISH_SITE_TASK_EVENT,
  LinkOrGeneratePublishSiteTaskEvent,
} from '../event/site-order.event';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { DeploySiteOrdersBaseService } from '../site-orders/deploy-site-orders.base.service';
import { SiteOrdersLogicService } from '../site-orders/site-orders.logic.service';
import { DeploySiteTasksBaseService } from './deploy-site-tasks.base.service';
import { PublishSiteTasksBaseService } from './publish-site-tasks.base.service';

@Injectable()
export class SiteTasksLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly deploySiteOrderBaseService: DeploySiteOrdersBaseService,
    private readonly deploySiteTasksBaseService: DeploySiteTasksBaseService,
    private readonly publishSiteTasksBaseService: PublishSiteTasksBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly siteOrdersLogicService: SiteOrdersLogicService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly siteService: WorkerModel2SiteService,
    private readonly storageService: WorkerModel2StorageService,
    private readonly publisherService: WorkerModel2PublisherService,
    private readonly dnsService: WorkerModel2DnsService,
    private readonly metaNetworkService: MetaNetworkService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async generateDeploySiteTask(
    siteConfigId: number,
    userId: number,
  ): Promise<{
    deploySiteTaskEntity: DeploySiteTaskEntity;
  }> {
    const id = this.newDeploySiteTaskId(siteConfigId);
    const deploySiteTaskEntity = await this.deploySiteTasksBaseService.save({
      id,
      userId,
      siteConfigId,
      state: PipelineOrderTaskCommonState.PENDING,
      // createdAt: new Date(),
      // updatedAt: new Date(),
    });

    return {
      deploySiteTaskEntity,
    };
  }
  newDeploySiteTaskId(siteConfigId: number): string {
    return `wt4site-${siteConfigId}-deploy-site-${uuid()}`;
  }
  async getDeploySiteTaskById(
    deploySiteTaskId: string,
  ): Promise<DeploySiteTaskEntity> {
    return await this.deploySiteTasksBaseService.getById(deploySiteTaskId);
  }

  async countUserDoingDeploySiteTask(userId: number): Promise<number> {
    return await this.deploySiteTasksBaseService.count({
      where: {
        userId,
        state: PipelineOrderTaskCommonState.DOING,
      },
    });
  }
  async countUserDoingPublishSiteTask(userId: number): Promise<number> {
    return await this.publishSiteTasksBaseService.count({
      where: {
        userId,
        state: PipelineOrderTaskCommonState.DOING,
      },
    });
  }
  async doingDeploySiteTask(deploySiteTaskEntity: DeploySiteTaskEntity) {
    deploySiteTaskEntity.state = PipelineOrderTaskCommonState.DOING;
    await this.deploySiteTasksBaseService.save(deploySiteTaskEntity);
    await this.deploySiteOrderBaseService.updateByDeploySiteTaskId(
      deploySiteTaskEntity.id,
      {
        state: deploySiteTaskEntity.state,
      },
    );
    // Change site state to Deploying
    await this.siteConfigLogicService.updateSiteConfigStatus(
      deploySiteTaskEntity.siteConfigId,
      SiteStatus.Deploying,
    );
  }
  async finishDeploySiteTask(id: string) {
    await this.deploySiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FINISHED,
    });
    const deploySiteTaskEntity = await this.deploySiteTasksBaseService.getById(
      id,
    );
    await this.deploySiteOrderBaseService.updateByDeploySiteTaskId(id, {
      state: PipelineOrderTaskCommonState.FINISHED,
    });
    await this.siteConfigLogicService.updateSiteConfigStatus(
      deploySiteTaskEntity.siteConfigId,
      SiteStatus.Deployed,
    );
  }
  async failDeploySiteTask(id: string) {
    await this.deploySiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    const deploySiteTaskEntity = await this.deploySiteTasksBaseService.getById(
      id,
    );
    await this.deploySiteOrderBaseService.updateByDeploySiteTaskId(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    await this.siteConfigLogicService.updateSiteConfigStatus(
      deploySiteTaskEntity.siteConfigId,
      SiteStatus.DeployFailed,
    );
  }

  async linkOrGeneratePublishSiteTask(siteConfigId: number, userId: number) {
    let publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getBySiteConfigUserId(
        siteConfigId,
        userId,
      );
    if (PipelineOrderTaskCommonState.PENDING !== publishSiteTaskEntity?.state) {
      //?????????????????????pending???????????????
      const id = this.newPublishSiteTaskId(siteConfigId);
      publishSiteTaskEntity = await this.publishSiteTasksBaseService.save({
        id,
        userId,
        siteConfigId,
        state: PipelineOrderTaskCommonState.PENDING,
      });
    } else {
      //?????????????????????????????????pending
    }
    // ????????????/??????????????????????????????
    await this.siteOrdersLogicService.updatePublishSiteTaskId(
      siteConfigId,
      userId,
      publishSiteTaskEntity.id,
    );
  }

  @OnEvent(LINK_OR_GENERATE_PUBLISH_SITE_TASK_EVENT)
  async handleLinkOrGeneratePublishSiteTaskEvent(
    linkOrGeneratePubishSiteTaskEvent: LinkOrGeneratePublishSiteTaskEvent,
  ) {
    this.logger.verbose(
      `handleLinkOrGeneratePublishSiteTaskEvent ${JSON.stringify(
        linkOrGeneratePubishSiteTaskEvent,
      )} `,
      this.constructor.name,
    );
    const { siteConfigId, userId } = linkOrGeneratePubishSiteTaskEvent;
    await this.linkOrGeneratePublishSiteTask(siteConfigId, userId);
  }

  newPublishSiteTaskId(siteConfigId: number): string {
    return `wt4site-${siteConfigId}-publish-site-${uuid()}`;
  }
  async getPublishSiteTaskById(
    publishSiteTaskId: string,
  ): Promise<PublishSiteTaskEntity> {
    return await this.publishSiteTasksBaseService.getById(publishSiteTaskId);
  }

  async getPendingPublishSiteTask(
    siteConfigId: number,
    userId: number,
  ): Promise<{
    publishSiteTaskEntity: PublishSiteTaskEntity;
  }> {
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getBySiteConfigUserIdAndState(
        siteConfigId,
        userId,
        PipelineOrderTaskCommonState.PENDING,
      );

    return {
      publishSiteTaskEntity,
    };
  }

  async getDoingPublishSiteTask(
    siteConfigId: number,
    userId: number,
  ): Promise<{
    publishSiteTaskEntity: PublishSiteTaskEntity;
  }> {
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getBySiteConfigUserIdAndState(
        siteConfigId,
        userId,
        PipelineOrderTaskCommonState.DOING,
      );

    return {
      publishSiteTaskEntity,
    };
  }

  async doingPublishSiteTask(publishSiteTaskEntity: PublishSiteTaskEntity) {
    publishSiteTaskEntity.state = PipelineOrderTaskCommonState.DOING;
    await this.publishSiteTasksBaseService.update(publishSiteTaskEntity.id, {
      workerName: publishSiteTaskEntity.workerName,
      workerSecret: publishSiteTaskEntity.workerSecret,
      state: PipelineOrderTaskCommonState.DOING,
    });
    await this.siteOrdersLogicService.doingPublishSite(
      publishSiteTaskEntity.id,
    );
    await this.postOrdersLogicService.doingPublishPost(
      publishSiteTaskEntity.id,
    );
    // Change site state to Publishing
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishSiteTaskEntity.siteConfigId,
      SiteStatus.Publishing,
    );
  }

  async finishPublishSiteTask(
    publishTaskConfig: MetaWorker.Configs.PublishTaskConfig,
  ) {
    const id = publishTaskConfig.task.taskId;
    await this.publishSiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FINISHED,
    });
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getById(id);
    const publisherType = publishTaskConfig.git.publisher
      .serviceType as MetaWorker.Enums.PublisherType;
    await this.updateDomain(publisherType, publishTaskConfig);
    await this.siteOrdersLogicService.finishPublishSite(id);
    await this.postOrdersLogicService.finishPublishPost(
      publishSiteTaskEntity.userId,
      id,
    );
    const stieConfigEntity =
      await this.siteConfigLogicService.getSiteConfigById(
        publishSiteTaskEntity.siteConfigId,
      );
    await this.siteConfigLogicService.setPublished(
      publishSiteTaskEntity.siteConfigId,
    );
    this.logger.verbose(
      `Site published ${publishTaskConfig.site.domain}.notify Meta-Network-BE`,
      this.constructor.name,
    );

    if (Number.isNaN(stieConfigEntity.lastPublishedAt.getTime())) {
      this.metaNetworkService.notifyMetaSpaceSiteCreated({
        ...publishTaskConfig.site,
        userId: publishSiteTaskEntity.userId,
      });
    } else {
      this.metaNetworkService.notifyMetaSpaceSitePublished({
        ...publishTaskConfig.site,
        userId: publishSiteTaskEntity.userId,
      });
    }
  }
  async failPublishSiteTask(id: string) {
    await this.publishSiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getById(id);
    await this.siteOrdersLogicService.failPublishSite(publishSiteTaskEntity.id);
    await this.postOrdersLogicService.failPublishPost(
      publishSiteTaskEntity.userId,
      id,
    );
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishSiteTaskEntity.siteConfigId,
      SiteStatus.PublishFailed,
    );
  }

  async generateDeployConfigAndRepoEmpty(
    user: Partial<UCenterUser>,
    configId: number,
  ): Promise<{
    deployConfig: MetaWorker.Configs.DeployConfig;
    repoEmpty: boolean;
  }> {
    this.logger.verbose(`Generate deploy config`, this.constructor.name);

    const { site, template, theme, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deploying,
      ]);

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
        SiteStatus.Publishing,
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
      gateway: this.configService.get('metaSpace.gateway'),
    };

    return {
      publisherType,
      publishConfig,
      template,
    };
  }

  async updateDomain(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    await this.updateDns(publisherType, publishConfig);
    await this.publisherService.updateDomainName(publisherType, publishConfig);
  }
  async updateDns(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    this.logger.verbose(
      `Update DNS siteConfigId ${publishConfig.site.configId} ${publisherType}`,
      this.constructor.name,
    );
    const targetOriginDomain =
      await this.publisherService.getTargetOriginDomain(
        publisherType,
        publishConfig,
      );
    const dnsRecord = {
      type: MetaWorker.Enums.DnsRecordType.CNAME,
      name: publishConfig.site.metaSpacePrefix,
      content: targetOriginDomain,
    };
    this.logger.verbose(
      `Update DNS siteConfigId ${
        publishConfig.site.configId
      } dnsRecord ${JSON.stringify(dnsRecord)}`,
    );
    await this.dnsService.updateDnsRecord(dnsRecord);
  }
}
