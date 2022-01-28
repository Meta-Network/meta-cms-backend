import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

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
  ) {}

  async saveDeploySiteOrder(
    userId: number,
    deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<DeploySiteOrderResponseDto> {
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
