import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SiteStatus } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import {
  DeploySiteOrderRequestDto,
  DeploySiteOrderResponseDto,
} from '../dto/site-order.dto';
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
  ) {}

  async saveDeploySiteOrder(
    userId: number,
    deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<DeploySiteOrderResponseDto> {
    // 必须校验meta space是否属于当前用户
    const siteConfigEntity =
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
    if (deploySiteOrder?.serverVerificationId) {
      const serverVerificationEntity =
        await this.serverVerificationBaseService.getById(
          deploySiteOrder.serverVerificationId,
        );
      // 从 serverVerification中的反序列化,也没那么重要
      let serverVerification;
      if (serverVerificationEntity?.payload) {
        serverVerification = JSON.parse(serverVerificationEntity.payload);
      }
      // TODO 如果现有的失败了，是否在触发重试？或者是，另外做一个入口？
      const deploySiteOrderResponseDto = {
        deploySiteOrder,
        serverVerification,
      };
      return deploySiteOrderResponseDto;
    }

    // 初始化自带一篇文章，做出对应的数据（内部也有校验）
    const { postOrder, serverVerification } =
      await this.postOrdersLogicService.savePostOrder(
        userId,
        deploySiteOrderRequestDto,
      );
    //TODO 处理建站逻辑，建站完成后更新post的submitState和publishState
    deploySiteOrder = await this.deploySiteOrdersBaseService.save({
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
