import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import { PostState } from '../../enums/postState';
import {
  EmptyAccessTokenException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { PostService } from './post.service';

class PostPagination extends PaginationResponse<PostEntity> {
  @ApiProperty({ type: PostEntity, isArray: true })
  readonly items: PostEntity[];
}
class PostListResponse extends TransformResponse<PostPagination> {
  @ApiProperty({ type: PostPagination })
  readonly data: PostPagination;
}
class PostEntityResponse extends TransformResponse<PostEntity> {
  @ApiProperty({ type: PostEntity })
  readonly data: PostEntity;
}

@ApiTags('post')
@ApiCookieAuth()
@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly accessTokenService: AccessTokenService,
  ) {}

  @Get()
  @ApiOkResponse({ type: PostListResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  @ApiForbiddenResponse({
    type: EmptyAccessTokenException,
    description: 'When request user has no any access tokens',
  })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  async getPosts(
    @User('id', ParseIntPipe) uid: number,
    @Query('page', ParseIntPipe, new DefaultValuePipe(1)) page: number,
    @Query('limit', ParseIntPipe, new DefaultValuePipe(10)) limit: number,
  ) {
    const hasAnyToken = await this.accessTokenService.hasAny(uid);
    if (!hasAnyToken) {
      throw new EmptyAccessTokenException();
    }

    const options = {
      page,
      limit,
      route: '/post',
    } as IPaginationOptions;

    return await this.postService.getPostsByUserId(uid, options);
  }

  @Post(':postId/publish')
  @ApiCreatedResponse({ type: PostEntityResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  async setPostPublished(
    @User('id', ParseIntPipe) uid: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.postService.setPostState(postId, PostState.Published);
  }

  @Post(':postId/ignore')
  @ApiCreatedResponse({ type: PostEntityResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  async setPostIgnored(
    @User('id', ParseIntPipe) uid: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.postService.setPostState(postId, PostState.Ignored);
  }

  @Post('sync/:platform')
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  @ApiForbiddenResponse({
    type: EmptyAccessTokenException,
    description: 'When request user has no any access tokens',
  })
  async triggerPostSync(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform') platform: string,
  ) {
    const hasAnyToken = await this.accessTokenService.hasAny(uid, platform);
    if (!hasAnyToken) {
      throw new EmptyAccessTokenException();
    }
  }
}
