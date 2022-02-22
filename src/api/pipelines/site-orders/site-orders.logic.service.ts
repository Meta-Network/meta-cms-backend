import {
  authorPostDigest,
  authorPostDigestSign,
  PostMetadata,
} from '@metaio/meta-signature-util-v2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';

import { defaultPostBuilder } from '../../../configs';
import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import { AccessDeniedException } from '../../../exceptions';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import {
  DeploySiteOrderRequestDto,
  PublishSiteOrderInQueueResponseDto,
} from '../dto/site-order.dto';
import {
  GENERATE_PUBLISH_SITE_ORDER_EVENT,
  GeneratePublishSiteOrderEvent,
  LINK_OR_GENERATE_PUBLISH_SITE_TASK_EVENT,
  LinkOrGeneratePublishSiteTaskEvent,
} from '../event/site-order.event';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publish-site-orders.base.service';

@Injectable()
export class SiteOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly deploySiteOrdersBaseService: DeploySiteOrdersBaseService,
    private readonly publishSiteOrdersBaseService: PublishSiteOrdersBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly postTasksLogicService: PostTasksLogicService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly serverVerificationBaseService: ServerVerificationBaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const postMetadata = this.getDefaultPostMetadata();
    if (!postMetadata) {
      throw new Error('config default-post.yaml not found');
    }
    for (const key of [
      'title',
      'content',
      'categories',
      'tags',
      'cover',
      'license',
      'summary',
    ]) {
      if (!postMetadata.hasOwnProperty(key)) {
        throw new Error(`Config default-post.yaml key ${key} not found`);
      }
    }
  }

  async saveDeploySiteOrder(
    userId: number,
    deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<DeploySiteOrderEntity> {
    const { siteConfigId } = deploySiteOrderRequestDto;
    // 必须校验meta space是否属于当前用户

    const siteConfigEntity =
      await this.siteConfigLogicService.validateSiteConfigUserId(
        siteConfigId,
        userId,
      );

    // 如果之前已经生成过repo，并初始化成功，并不需要再次deploy,直接返回就可以了，一般来说前端也会控制(注意旧数据的迁移)
    // 这里如果能取到数据，说明之前有做过
    const deploySiteOrder =
      await this.deploySiteOrdersBaseService.getBySiteConfigUserId(
        siteConfigId,
        userId,
      );
    if (deploySiteOrder?.id) {
      if (SiteStatus.DeployFailed === siteConfigEntity.status) {
        this.siteConfigLogicService.updateSiteConfigStatus(
          siteConfigId,
          SiteStatus.Configured,
        );
      }
      // 关于其他状态为何不需要特别做什么的解析。
      // Configured 刚点击过建站就会在这个状态。站点是配置好的，还没开启建站而已，只要等待就行了
      // Deploying 正在建站中，等待结果就行了
      // Deployed 已经建好了，不需要再建了，直接返回
      // Publishing Published PublishFailed 都是要在上一步之后才能做的，道理是一样的，不需要再建了
      return deploySiteOrder;
    } else {
      // 这里是第一次创建用户的deploy site order
      this.logger.verbose(
        `Create deploy site order userId ${userId} siteConfigId ${deploySiteOrderRequestDto.siteConfigId}`,
        SiteOrdersLogicService.name,
      );
      // 因为这里的时间戳是先有postOrder再有deploySiteOrder，需要注意和自动调度机制的配合。自动调度机制是按时间戳来优先处理的，如果postOrder的submitState是pending，那会变成先处理，然后没有repo失败
      // 做成提交成功发布成功的状态
      // 初始化自带一篇文章，做出对应的数据。这个数据由服务器生成并签名
      const { postOrder } = await this.postOrdersLogicService.savePostOrder(
        userId,
        this.createDefaultPostOrderRequestDto(),
        {
          submitState: PipelineOrderTaskCommonState.FINISHED,
          publishState: PipelineOrderTaskCommonState.FINISHED,
        },
      );

      //处理建站逻辑，建站完成后更新post的submitState和publishState 在 worker-tasks.dispatcher.servcie->post-orders.logic.service
      return await this.deploySiteOrdersBaseService.save({
        id: postOrder.id,
        userId,
        siteConfigId,
        serverVerificationId: postOrder.serverVerificationId,
      });
    }
  }
  async generatePublishSiteOrder(
    userId: number,
  ): Promise<PublishSiteOrderEntity> {
    const defaultSiteConfig = await this.getUserDefaultSiteConfig(userId);
    this.logger.verbose(
      `Generate publish site order siteConfigId ${defaultSiteConfig.id} userId ${userId} `,
      this.constructor.name,
    );
    const siteConfigId = defaultSiteConfig.id;
    //如果有现成的就直接用
    let publishSiteOrder =
      await this.publishSiteOrdersBaseService.getBySiteConfigUserIdAndState(
        siteConfigId,
        userId,
        PipelineOrderTaskCommonState.PENDING,
      );
    if (!publishSiteOrder) {
      publishSiteOrder = await this.publishSiteOrdersBaseService.save({
        userId,
        siteConfigId,
      });
    }
    this.eventEmitter.emit(LINK_OR_GENERATE_PUBLISH_SITE_TASK_EVENT, {
      userId,
      siteConfigId,
    } as LinkOrGeneratePublishSiteTaskEvent);
    return publishSiteOrder;
  }
  async getUserDefaultSiteConfig(userId: number) {
    return await this.siteConfigLogicService.getUserDefaultSiteConfig(userId);
  }

  @OnEvent(GENERATE_PUBLISH_SITE_ORDER_EVENT)
  async handleGeneratePublishSiteOrderEvent(
    generatePublishSiteOrderEvent: GeneratePublishSiteOrderEvent,
  ) {
    const publishSiteOrderEntity = await this.generatePublishSiteOrder(
      generatePublishSiteOrderEvent.userId,
    );
    await this.postTasksLogicService.updatePublishSiteOrderId(
      generatePublishSiteOrderEvent.postTaskId,
      publishSiteOrderEntity.id,
    );
  }

  async validateAndGetPublishSiteOrder(
    publishSiteOrderId: number,
    userId: number,
  ): Promise<PublishSiteOrderEntity> {
    const publishSiteOrderEntity =
      await this.publishSiteOrdersBaseService.getByPublishSiteOrderId(
        publishSiteOrderId,
      );
    if (publishSiteOrderEntity?.userId !== userId) {
      throw new AccessDeniedException('access denied, user id inconsistent');
    }
    return publishSiteOrderEntity;
  }

  async getUserPublishSiteOrdersInQueue(
    userId: number,
  ): Promise<PublishSiteOrderInQueueResponseDto> {
    const pending = await this.publishSiteOrdersBaseService.getByUserIdAndState(
      userId,
      PipelineOrderTaskCommonState.PENDING,
    );
    const doing = await this.publishSiteOrdersBaseService.getByUserIdAndState(
      userId,
      PipelineOrderTaskCommonState.DOING,
    );
    return {
      pending,
      doing,
    };
  }

  async getFirstPendingDeploySiteOrder(): Promise<DeploySiteOrderEntity> {
    return await this.deploySiteOrdersBaseService.getFirstByState(
      PipelineOrderTaskCommonState.PENDING,
    );
  }
  async getFirstPendingPublishSiteOrder(): Promise<PublishSiteOrderEntity> {
    return await this.publishSiteOrdersBaseService.getFirstByState(
      PipelineOrderTaskCommonState.PENDING,
    );
  }

  async updatePublishSiteTaskId(
    siteConfigId: number,
    userId: number,
    publishSiteTaskId: string,
  ) {
    // 本来有判断publishSiteTaskId为空，目前看来是不需要的。因为就算之前关联上了，那个任务如果失败了的话，后续有成功的publishTask，一样会全部带出去，也就是说关联关系就是会更新的。那么应该根据状态来判断
    // 查询条件为避免混淆，顺序和索引一致
    await this.publishSiteOrdersBaseService.batchUpdate(
      {
        state: In([
          PipelineOrderTaskCommonState.PENDING,
          PipelineOrderTaskCommonState.FAILED,
        ]),
        userId,
        siteConfigId,
      },
      { publishSiteTaskId },
    );

    const publishSiteOrderEntities =
      await this.publishSiteOrdersBaseService.getByPublishSiteTaskId(
        publishSiteTaskId,
      );
    await this.postTasksLogicService.updatePublishSiteTaskId(
      publishSiteOrderEntities.map(
        (publishSiteOrderEntity) => publishSiteOrderEntity.id,
      ),
      publishSiteTaskId,
    );
  }
  createDefaultPostOrderRequestDto(): PostOrderRequestDto {
    const postMetadata = this.getDefaultPostMetadata();
    const defaultPostDigest = authorPostDigest.generate(postMetadata);
    const defaultPostSign = authorPostDigestSign.generate(
      this.configService.get('metaSignature.serverKeys'),
      this.configService.get('metaSignature.serverDomain'),
      defaultPostDigest.digest,
    );
    return {
      authorPostDigest: defaultPostDigest,
      authorPostSign: defaultPostSign,
    };
  }

  getDefaultPostMetadata(): PostMetadata {
    return defaultPostBuilder() as PostMetadata;
  }

  async doingPublishSite(publishSiteTaskId: string) {
    await this.publishSiteOrdersBaseService.batchUpdate(
      {
        publishSiteTaskId,
      },
      {
        state: PipelineOrderTaskCommonState.DOING,
      },
    );
  }

  async finishPublishSite(publishSiteTaskId: string) {
    await this.publishSiteOrdersBaseService.batchUpdate(
      {
        publishSiteTaskId,
      },
      {
        state: PipelineOrderTaskCommonState.FINISHED,
      },
    );
  }

  async failPublishSite(publishSiteTaskId: string) {
    await this.publishSiteOrdersBaseService.batchUpdate(
      {
        publishSiteTaskId,
      },
      {
        state: PipelineOrderTaskCommonState.FAILED,
      },
    );
  }
}
