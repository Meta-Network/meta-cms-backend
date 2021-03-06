import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '../../../decorators';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import {
  TransformCreatedResponse,
  TransformResponse,
} from '../../../utils/responseClass';
import { PostMethodValidation } from '../../../utils/validation';
import {
  DeploySiteOrderRequestDto,
  PublishSiteOrderInQueueResponseDto,
} from '../dto/site-order.dto';
import { SiteOrdersLogicService } from './site-orders.logic.service';

class PublishSiteOrderResponse extends TransformResponse<PublishSiteOrderEntity> {
  @ApiProperty({ type: PublishSiteOrderEntity })
  readonly data: PublishSiteOrderEntity;
}
class PublishSiteOrderCreatedResponse extends TransformCreatedResponse<PublishSiteOrderEntity> {
  @ApiProperty({ type: PublishSiteOrderEntity })
  readonly data: PublishSiteOrderEntity;
}
class PublishSiteOrderInQueueResponse extends TransformResponse<PublishSiteOrderInQueueResponseDto> {
  @ApiProperty({
    type: PublishSiteOrderInQueueResponseDto,
  })
  readonly data: {
    pending: PublishSiteOrderEntity;
    doing: PublishSiteOrderEntity;
  };
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
  @ApiCreatedResponse({ type: TransformCreatedResponse })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'can not deploy',
  })
  @Post('deploy')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploy(
    @User('id', ParseIntPipe) userId: number,
    @Body() deploySiteOrderRequestDto: DeploySiteOrderRequestDto,
  ): Promise<void> {
    await this.siteOrdersLogicService.saveDeploySiteOrder(
      userId,
      deploySiteOrderRequestDto,
    );
  }

  @ApiOperation({
    summary: '根据ID获取发布Meta Space请求',
  })
  @ApiOkResponse({ type: PublishSiteOrderResponse })
  @Get('publish/:publishSiteOrderId')
  async getPublishSiteOrder(
    @User('id', ParseIntPipe) userId: number,
    @Param('publishSiteOrderId', ParseIntPipe) publishSiteOrderId: number,
  ): Promise<PublishSiteOrderEntity> {
    return await this.siteOrdersLogicService.validateAndGetPublishSiteOrder(
      publishSiteOrderId,
      userId,
    );
  }
  @ApiOperation({
    summary: '用户获取属于自己的发布Meta Space请求',
  })
  @ApiOkResponse({ type: PublishSiteOrderInQueueResponse })
  @Get('mine/publish-in-queue')
  async getUserPublishSiteOrdersInQueue(
    @User('id', ParseIntPipe) userId: number,
  ): Promise<PublishSiteOrderInQueueResponseDto> {
    return await this.siteOrdersLogicService.getUserPublishSiteOrdersInQueue(
      userId,
    );
  }
  @ApiOperation({
    summary: '用户请求发布Meta Space',
  })
  @ApiCreatedResponse({ type: PublishSiteOrderCreatedResponse })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'can not publish',
  })
  @Post('publish')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async publish(
    @User('id', ParseIntPipe) userId: number,
  ): Promise<PublishSiteOrderEntity> {
    return await this.siteOrdersLogicService.generatePublishSiteOrder(userId);
  }
}
