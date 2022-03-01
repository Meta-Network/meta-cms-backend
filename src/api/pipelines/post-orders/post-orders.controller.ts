import {
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

import { User } from '../../../decorators';
import { DataNotFoundException } from '../../../exceptions';
import {
  TransformCreatedResponse,
  TransformResponse,
} from '../../../utils/responseClass';
import { PostMethodValidation } from '../../../utils/validation';
import {
  PostOrderPaginationResponse,
  PostOrderRequestDto,
  PostOrderResponseDto,
  PostPublishNotificationDto,
} from '../dto/post-order.dto';
import { PostOrdersLogicService } from './post-orders.logic.service';

class SavePostOrderResponse extends TransformCreatedResponse<PostOrderResponseDto> {
  @ApiProperty({ type: PostOrderResponseDto })
  readonly data: PostOrderResponseDto;
}

@ApiTags('pipeline')
@Controller('v1/pipelines/post-orders')
export class PostOrdersController {
  constructor(
    private readonly postOrdersLogicService: PostOrdersLogicService,
  ) {}
  @Get('/mine')
  @ApiOkResponse({ type: PostOrderPaginationResponse })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  public async pagiUserAllPostOrders(
    @User('id', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const options = {
      page,
      limit,
      route: '/v1/pipelines/post-orders/mine',
    } as IPaginationOptions;

    return await this.postOrdersLogicService.pagiUserAllPostOrders(
      userId,
      options,
    );
  }

  @Get('/mine/count')
  @ApiOkResponse({ type: PostPublishNotificationDto })
  public async countUserPostOrdersAsNotification(
    @User('id', ParseIntPipe) userId: number,
  ) {
    return await this.postOrdersLogicService.countUserPostOrdersAsNotification(
      userId,
    );
  }

  @Get('/mine/publishing')
  @ApiOkResponse({ type: PostOrderPaginationResponse })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  public async pagiUserPublishingPostOrders(
    @User('id', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const options = {
      page,
      limit,
      route: '/v1/pipelines/post-orders/mine/publishing',
    } as IPaginationOptions;

    return await this.postOrdersLogicService.pagiUserPublishingPostOrders(
      userId,
      options,
    );
  }

  @Get('/mine/published')
  @ApiOkResponse({ type: PostOrderPaginationResponse })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  public async pagiUserPublishedPostOrders(
    @User('id', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const options = {
      page,
      limit,
      route: '/v1/pipelines/post-orders/mine/published',
    } as IPaginationOptions;

    return await this.postOrdersLogicService.pagiUserPublishedPostOrders(
      userId,
      options,
    );
  }

  @ApiOperation({
    summary: '用户请求发布文章',
  })
  @ApiCreatedResponse({ type: SavePostOrderResponse })
  @ApiConflictResponse({
    description: '相同签名的文章已存在的情况下返回',
  })
  @Post()
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async savePostOrder(
    @User('id', ParseIntPipe) userId: number,
    @Body() postOrderRequestDto: PostOrderRequestDto,
  ): Promise<PostOrderResponseDto> {
    return await this.postOrdersLogicService.savePostOrder(
      userId,
      postOrderRequestDto,
    );
  }

  @ApiOperation({
    summary: '用户请求重新发布失败文章',
  })
  @ApiCreatedResponse({ type: TransformCreatedResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request post order not found',
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'can not deploy',
  })
  @Post(':id/retry')
  async retryPostOrder(
    @User('id', ParseIntPipe) userId: number,
    @Param('id') id: string,
  ): Promise<void> {
    await this.postOrdersLogicService.retryPostOrder(userId, id);
  }
}
