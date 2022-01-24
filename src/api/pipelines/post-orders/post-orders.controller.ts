import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

import { User } from '../../../decorators';
import { PostState } from '../../../types/enum';
import {
  PostOrderPaginationResponse,
  PostOrderRequestDto,
  PostOrderResponseDto,
} from '../dto/post-order.dto';
import { PostOrdersLogicService } from './post-orders.logic.service';

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
  @Post()
  async savePostOrder(
    @User('id', ParseIntPipe) userId: number,
    @Body() postOrderRequestDto: PostOrderRequestDto,
  ): Promise<PostOrderResponseDto> {
    return this.postOrdersLogicService.savePostOrder(
      userId,
      postOrderRequestDto,
    );
  }

  @ApiOperation({
    summary: '用户请求重新发布失败文章',
  })
  @Post(':id/retry')
  async retryPostOrder(
    @User('id', ParseIntPipe) userId: number,
    @Param('id') id: string,
  ): Promise<void> {
    return this.postOrdersLogicService.retryPostOrder(userId, id);
  }
}
