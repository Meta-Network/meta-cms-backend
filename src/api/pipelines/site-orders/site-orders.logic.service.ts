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
import { SiteConfigLogicService } from '../../site/config/logicService';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import { DeploySiteOrderRequestDto } from '../dto/site-order.dto';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';

@Injectable()
export class SiteOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deploySiteOrdersBaseService: DeploySiteOrdersBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly serverVerificationBaseService: ServerVerificationBaseService,
    private readonly configService: ConfigService,
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
    // 必须校验meta space是否属于当前用户

    await this.siteConfigLogicService.validateSiteConfigUserId(
      deploySiteOrderRequestDto.siteConfigId,
      userId,
    );

    // 如果之前已经生成过repo，并初始化成功，并不需要再次deploy,直接返回就可以了，一般来说前端也会控制(注意旧数据的迁移)
    // 这里如果能取到数据，说明之前有做过
    // TODO 进一步判定重试操作？
    let deploySiteOrder =
      await this.deploySiteOrdersBaseService.getBySiteConfigUserId(
        deploySiteOrderRequestDto.siteConfigId,
        userId,
      );
    if (deploySiteOrder?.id) {
      console.log(deploySiteOrder);
      return deploySiteOrder;
    }
    this.logger.verbose(
      `Create deploy site order userId ${userId} siteConfigId ${deploySiteOrderRequestDto.siteConfigId}`,
      SiteOrdersLogicService.name,
    );

    // 初始化自带一篇文章，做出对应的数据。这个数据由服务器生成并签名
    const { postOrder } = await this.postOrdersLogicService.savePostOrder(
      userId,
      this.createDefaultPostOrderRequestDto(),
    );
    //TODO 处理建站逻辑，建站完成后更新post的submitState和publishState
    deploySiteOrder = await this.deploySiteOrdersBaseService.save({
      id: postOrder.id,
      userId,
      siteConfigId: deploySiteOrderRequestDto.siteConfigId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return deploySiteOrder;
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
