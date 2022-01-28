import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SiteConfigLogicService } from '../../site/config/logicService';
import {
  DeploySiteOrderRequestDto,
  DeploySiteOrderResponseDto,
} from '../dto/site-order.dto';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publlish-site-orders.base.service';

@Injectable()
export class SiteOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deploySiteOrdersBaseService: DeploySiteOrdersBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly siteConfigLogicService: SiteConfigLogicService,
  ) {}

  async saveDeploySiteOrder(
    userId: number,
    deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<DeploySiteOrderResponseDto> {
    this.siteConfigLogicService.validateSiteConfigUserId(
      deploySiteOrderRequestDto.siteConfigId,
      userId,
    );
    // 初始化自带一篇文章，做出对应的数据（内部也有校验）
    const { postOrder, serverVerification } =
      await this.postOrdersLogicService.savePostOrder(
        userId,
        deploySiteOrderRequestDto,
      );
    //TODO 处理建站逻辑，建站完成后更新post的submitState和publishState
    const deploySiteOrder = await this.deploySiteOrdersBaseService.save({
      id: postOrder.id,
      userId,
      siteConfigId: deploySiteOrderRequestDto.siteConfigId,
      serverVerificationId: serverVerification.signature,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      deploySiteOrder,
      serverVerification,
    };
  }
}
