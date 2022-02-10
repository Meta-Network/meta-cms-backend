import { MetaWorker } from '@metaio/worker-model2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
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
  ) {}

  async generateDeploySiteTask(
    siteConfigId: number,
    userId: number,
  ): Promise<{
    deploySiteOrderEntity: DeploySiteOrderEntity;
    deploySiteTaskEntity: DeploySiteTaskEntity;
  }> {
    const deploySiteOrderEntity =
      await this.deploySiteOrderBaseService.getBySiteConfigUserId(
        siteConfigId,
        userId,
      );
    const id = this.newDeploySiteTaskId();
    const deploySiteTaskEntity = await this.deploySiteTasksBaseService.save({
      id,
      userId,
      siteConfigId,
      state: PipelineOrderTaskCommonState.PENDING,
      // createdAt: new Date(),
      // updatedAt: new Date(),
    });
    deploySiteOrderEntity.deploySiteTaskId = deploySiteTaskEntity.id;
    await this.deploySiteOrderBaseService.save(deploySiteOrderEntity);
    return {
      deploySiteOrderEntity,
      deploySiteTaskEntity,
    };
  }
  newDeploySiteTaskId(): string {
    return `wt4site-deploy-site-${uuid()}`;
  }
  async getDeploySiteTaskById(
    deploySiteTaskId: string,
  ): Promise<DeploySiteTaskEntity> {
    return await this.deploySiteTasksBaseService.getById(deploySiteTaskId);
  }
  async doingDeploySiteTask(deploySiteTaskEntity: DeploySiteTaskEntity) {
    deploySiteTaskEntity.state = PipelineOrderTaskCommonState.DOING;
    await this.deploySiteTasksBaseService.save(deploySiteTaskEntity);
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
  }
  async failDeploySiteTask(id: string) {
    await this.deploySiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    // SiteStatus没有对应的状态，会变成一直停在Deploying
  }

  async linkOrGeneratePublishSiteTask(siteConfigId: number, userId: number) {
    let publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getBySiteConfigUserId(
        siteConfigId,
        userId,
      );
    if (PipelineOrderTaskCommonState.PENDING !== publishSiteTaskEntity?.state) {
      //如果没有，先生成
      const id = this.newPublishSiteTaskId();
      publishSiteTaskEntity = await this.publishSiteTasksBaseService.save({
        id,
        userId,
        siteConfigId,
        state: PipelineOrderTaskCommonState.PENDING,
      });
    }
    await this.siteOrdersLogicService.updatePublishSiteTaskId(
      siteConfigId,
      userId,
      publishSiteTaskEntity.id,
    );
  }

  newPublishSiteTaskId(): string {
    return `wt4site-publish-site-${uuid()}`;
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
      await this.publishSiteTasksBaseService.getBySiteConfigUserId(
        siteConfigId,
        userId,
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
    await this.postOrdersLogicService.doingPublishPost(
      publishSiteTaskEntity.id,
    );
    // Change site state to Publishing
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishSiteTaskEntity.siteConfigId,
      SiteStatus.Publishing,
    );
  }

  async finishPublishSiteTask(id: string) {
    await this.publishSiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FINISHED,
    });
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getById(id);
    this.postOrdersLogicService.finishPublishPost(
      publishSiteTaskEntity.userId,
      id,
    );
    // Change site state to Published
    await this.siteConfigLogicService.updateSiteConfigStatus(
      publishSiteTaskEntity.siteConfigId,
      SiteStatus.Published,
    );
  }
  async failPublishSiteTask(id: string) {
    await this.publishSiteTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    const publishSiteTaskEntity =
      await this.publishSiteTasksBaseService.getById(id);
    this.postOrdersLogicService.failPublishPost(
      publishSiteTaskEntity.userId,
      id,
    );
    // SiteStatus没有对应的状态，会变成一直停在Publishing
  }
}
