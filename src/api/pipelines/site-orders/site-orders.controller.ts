import { Body, Controller, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '../../../decorators';
import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { TransformResponse } from '../../../utils/responseClass';
import {
  DeploySiteOrderRequestDto,
  DeploySiteOrderResponseDto,
} from '../dto/site-order.dto';
import { SiteOrdersLogicService } from './site-orders.logic.service';

class DeploySiteOrderResponse extends TransformResponse<DeploySiteOrderResponseDto> {
  @ApiProperty({ type: DeploySiteOrderResponseDto })
  readonly data: DeploySiteOrderResponseDto;
}

@ApiTags('pipeline')
@Controller('v1/pipelines/site-orders')
export class SiteOrdersController {
  constructor(
    private readonly siteOrdersLogicService: SiteOrdersLogicService,
  ) {}
  @ApiOperation({
    summary: '用户请求创建Meta Space',
  })
  @ApiOkResponse({ type: DeploySiteOrderResponse })
  @Post('deploy')
  async deploy(
    @User('id', ParseIntPipe) userId: number,
    @Body() deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<DeploySiteOrderResponseDto> {
    return this.siteOrdersLogicService.saveDeploySiteOrder(
      userId,
      deploySiteOrderRequestDto,
    );
  }
  @Post('publish')
  async publish(): Promise<any> {
    return;
  }
}
