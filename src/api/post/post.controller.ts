import { Controller, DefaultValuePipe, Get, ParseIntPipe, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import { RequirdHttpHeadersNotFoundException } from '../../exceptions';
import { PaginationResponse, TransformResponse } from '../../utils/responseClass';
import { PostService } from './post.service';

class PostPagination extends PaginationResponse<PostEntity> {
  @ApiProperty({ type: PostEntity, isArray: true })
  readonly items: PostEntity[];
}
class PostListResponse extends TransformResponse<PostPagination> {
  @ApiProperty({ type: PostEntity, isArray: true })
  readonly data: PostPagination[];
}

@ApiTags('post')
@ApiCookieAuth()
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiOkResponse({ type: PostListResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  async getPosts(
    @User('id', ParseIntPipe) uid: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    const options = {
      page,
      limit: limit > 100 ? 100 : limit,
      route: '/post',
    } as IPaginationOptions;

    return await this.postService.getPostsByUserId(uid, options);
  }

  @Put(':id/state')
  async setPostState(
    @User('id', ParseIntPipe) uid: number,

  ) {

  }
}
