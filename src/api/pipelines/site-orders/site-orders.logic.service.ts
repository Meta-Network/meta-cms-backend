import {
  authorPostDigest,
  authorPostDigestSign,
  PostMetadata,
} from '@metaio/meta-signature-util-v2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { defaultPostBuilder } from '../../../configs';
import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import { DeploySiteOrderRequestDto } from '../dto/site-order.dto';
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
    } else {
      // 这里是第一次创建用户的deploy site order
      this.logger.verbose(
        `Create deploy site order userId ${userId} siteConfigId ${deploySiteOrderRequestDto.siteConfigId}`,
        SiteOrdersLogicService.name,
      );

      // 初始化自带一篇文章，做出对应的数据。这个数据由服务器生成并签名
      const { postOrder } = await this.postOrdersLogicService.savePostOrder(
        userId,
        this.createDefaultPostOrderRequestDto(),
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
    const defaultSiteConfig =
      await this.siteConfigLogicService.getUserDefaultSiteConfig(userId);
    this.logger.verbose(
      `Generate publish site order siteConfigId ${defaultSiteConfig.id} userId ${userId} `,
      this.constructor.name,
    );
    return await this.publishSiteOrdersBaseService.save({
      userId,
      siteConfigId: defaultSiteConfig.id,
    });
  }

  async updatePublishSiteTaskId(
    siteConfigId: number,
    userId: number,
    publishSiteTaskId: string,
  ) {
    await this.publishSiteOrdersBaseService.batchUpdate(
      {
        siteConfigId,
        userId,
        publishSiteTaskId: '',
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
}
