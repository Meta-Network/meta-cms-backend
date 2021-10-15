import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Redis } from 'ioredis';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

import { MetaMicroserviceClient } from '../../constants';
import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import { PostState } from '../../enums/postState';
import {
  EmptyAccessTokenException,
  PostSyncingException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { UCenterJWTPayload } from '../../types';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { DraftPostCreationDto, DraftPostUpdateDto } from './dto/draft-post-dto';
import { PublishPostDto, PublishPostsDto } from './dto/publish-post.dto';
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

class SyncStateResponse extends TransformResponse<'idle' | 'syncing' | number> {
  @ApiProperty({ type: String, example: 'idle | syncing | 1' })
  readonly data: 'idle' | 'syncing' | number;
}

@ApiTags('post')
@ApiCookieAuth()
@ApiBadRequestResponse({
  type: RequirdHttpHeadersNotFoundException,
  description: 'When cookie with access token not provided',
})
@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly accessTokenService: AccessTokenService,
    @Inject(MetaMicroserviceClient.UCenter)
    private readonly microserviceClient: ClientProxy,
    @Inject('REDIS')
    private readonly redisClient: Redis,
  ) {}

  @Get()
  @ApiOkResponse({ type: PostListResponse })
  @ApiForbiddenResponse({
    type: EmptyAccessTokenException,
    description: 'When request user has no any access tokens',
  })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  @ApiQuery({ name: 'state', enum: PostState, example: 'pending' })
  async getPosts(
    @User('id', ParseIntPipe) uid: number,
    @Query('page', ParseIntPipe, new DefaultValuePipe(1))
    page: number,
    @Query('limit', ParseIntPipe, new DefaultValuePipe(10)) limit: number,
    @Query('state', new DefaultValuePipe(PostState.Pending)) state: PostState,
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

    return await this.postService.getPostsByUserId(uid, state, options);
  }

  @Post(':postId(\\d+)/publish')
  @ApiCreatedResponse({ type: PostEntityResponse })
  async publishPost(
    @User() user: UCenterJWTPayload,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: PublishPostDto,
  ) {
    return await this.postService.publishPendingPost(user, postId, body);
  }
  @Post('publish')
  @ApiCreatedResponse({ type: PostEntityResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  async publishPosts(
    @User() user: UCenterJWTPayload,
    @Body() body: PublishPostsDto,
  ) {
    return await this.postService.publishPendingPosts(user, body);
  }

  @Post(':postId(\\d+)/ignore')
  @ApiCreatedResponse({ type: PostEntityResponse })
  async setPostIgnored(
    @User('id', ParseIntPipe) uid: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.postService.setPostState(postId, PostState.Ignored);
  }

  @Post('sync/:platform')
  @ApiForbiddenResponse({
    type: EmptyAccessTokenException,
    description: 'When request user has no any access tokens',
  })
  @ApiConflictResponse({
    type: PostSyncingException,
    description: 'When spider is triggered but not completed',
  })
  async triggerPostSync(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform') platform: string,
  ) {
    const hasAnyToken = await this.accessTokenService.hasAny(uid, platform);
    if (!hasAnyToken) {
      throw new EmptyAccessTokenException();
    }

    const state = await this.redisClient.get(
      `cms:post:sync_state:${platform}:${uid}`,
    );
    if (state === `syncing`) {
      throw new PostSyncingException();
    }

    await this.redisClient.set(
      `cms:post:sync_state:${platform}:${uid}`,
      'syncing',
      'ex',
      60,
    );

    this.microserviceClient.emit(`cms.post.sync.${platform}`, uid);
  }

  @Get('sync/:platform/state')
  @ApiOkResponse({
    type: SyncStateResponse,
  })
  async getSyncState(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform') platform: string,
  ) {
    const result =
      (await this.redisClient.get(`cms:post:sync_state:${platform}:${uid}`)) ??
      'idle';
    const numberResult = parseInt(result, 10);
    if (!Number.isNaN(numberResult)) {
      await this.redisClient.del(`cms:post:sync_state:${platform}:${uid}`);
      return numberResult;
    }

    return result;
  }

  @Post(':postId(\\d+)/draft')
  @ApiCreatedResponse({ type: PostEntityResponse })
  async getDraftOfPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.postService.makeDraft(postId);
  }

  @Get(':postId(\\d+)')
  @ApiOkResponse({ type: PostEntityResponse })
  async getPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.postService.getPost(postId);
  }

  @Post()
  @ApiCreatedResponse({ type: PostEntityResponse })
  async createDraftPost(
    @User('id', ParseIntPipe) uid: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: DraftPostCreationDto,
  ) {
    return await this.postService.createPost(uid, dto);
  }
  @Patch(':postId')
  @ApiOkResponse({ type: PostEntityResponse })
  async updateDraftPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: DraftPostUpdateDto,
  ) {
    return await this.postService.updatePost(postId, dto);
  }
}
