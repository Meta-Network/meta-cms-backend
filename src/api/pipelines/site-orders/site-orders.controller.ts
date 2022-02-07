import { Body, Controller, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '../../../decorators';
import { TransformResponse } from '../../../utils/responseClass';
import { DeploySiteOrderRequestDto } from '../dto/site-order.dto';
import { SiteOrdersLogicService } from './site-orders.logic.service';

@ApiTags('pipeline')
@Controller('v1/pipelines/site-orders')
export class SiteOrdersController {
  constructor(
    private readonly siteOrdersLogicService: SiteOrdersLogicService,
  ) {}
  @ApiOperation({
    summary: '用户请求创建Meta Space',
  })
  @ApiOkResponse({ type: TransformResponse })
  @Post('deploy')
  async deploy(
    @User('id', ParseIntPipe) userId: number,
    @Body() deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<void> {
    await this.siteOrdersLogicService.saveDeploySiteOrder(
      userId,
      deploySiteOrderRequestDto,
    );
  }
  @Post('publish')
  async publish(): Promise<any> {
    return;
  }
}
