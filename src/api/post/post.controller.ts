import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
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
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Redis } from 'ioredis';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

import { MetaMicroserviceClient } from '../../constants';
import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import {
  EmptyAccessTokenException,
  InvalidPlatformException,
  PostSyncingException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { ParsePlatformPipe } from '../../pipes/parse-platform.pipe';
import { UCenterJWTPayload } from '../../types';
import { PostState } from '../../types/enum';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { PostMethodValidation } from '../../utils/validation';
import { AccessTokenService } from '../synchronizer/access-token.service';
import { PublishStoragePostsDto } from './dto/publish-post.dto';
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

  @Post('storage/publish')
  @ApiOperation({
    summary:
      'Publish posts to user storage, state must be pending or pending_edit.',
    description:
      'If draft is true, post will publish as draft. For example: in Hexo platform, when draft is set true, will create a post file in _drafts folder.',
  })
  @ApiQuery({ name: 'draft', type: Boolean, example: false })
  @ApiOkResponse({ type: PostEntityResponse })
  @ApiConflictResponse({
    description: 'When post state is not pending or pending_edit.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async publishPostsToStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', ParseBoolPipe, new DefaultValuePipe(false)) draft: boolean,
    @Body() body: PublishStoragePostsDto,
  ) {
    return await this.postService.publishPostsToStorage(user, body, draft);
  }

  @Post('storage/update')
  @ApiOperation({
    summary: 'Update posts in user storage, state must be published or drafted',
    description:
      'If draft is true, will update draft post. For example: in Hexo platform, when draft is set true, will update post file in _drafts folder.',
  })
  @ApiQuery({ name: 'draft', type: Boolean, example: false })
  @ApiOkResponse({ type: PostEntityResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async updatePostsToStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', ParseBoolPipe, new DefaultValuePipe(false)) draft: boolean,
    @Body() body: PublishStoragePostsDto,
  ) {
    return await this.postService.updatePostsInStorage(user, body, draft);
  }

  @Post('storage/delete')
  @ApiOperation({
    summary: 'Delete posts on user storage, state must be published or drafted',
    description:
      'If draft is true, will delete draft post. For example: in Hexo platform, when draft is set true, will delete post file in _drafts folder.',
  })
  @ApiQuery({ name: 'draft', type: Boolean, example: false })
  @ApiOkResponse({ type: PostEntityResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async deletePostOnStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', ParseBoolPipe, new DefaultValuePipe(false)) draft: boolean,
    @Body() body: PublishStoragePostsDto,
  ) {
    return await this.postService.deletePostsOnStorage(user, body, draft);
  }

  @Post('storage/move')
  @ApiOperation({
    summary: 'Move posts in user storage, state must be published or drafted',
    description:
      'If draft is true, will move a file from post to draft folder, if draft is false, will move a file from draft to post. For example: in Hexo platform, when draft is set true, will move post file from _posts folder to _drafts folder, when draft is set false, will move post file from _drafts folder to _posts folder.',
  })
  @ApiQuery({ name: 'draft', type: Boolean, example: false })
  @ApiOkResponse({ type: PostEntityResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async movePostsInStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', ParseBoolPipe, new DefaultValuePipe(false)) draft: boolean,
    @Body() body: PublishStoragePostsDto,
  ) {
    return await this.postService.movePostsInStorage(user, body, draft);
  }

  @Get('sync')
  @ApiOkResponse({ type: PostListResponse })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  @ApiQuery({ name: 'state', enum: PostState, example: 'pending' })
  public async getPosts(
    @User('id', ParseIntPipe) uid: number,
    @Query('page', ParseIntPipe, new DefaultValuePipe(1))
    page: number,
    @Query('limit', ParseIntPipe, new DefaultValuePipe(10)) limit: number,
    @Query('state', new DefaultValuePipe(PostState.Pending)) state: PostState,
  ) {
    const options = {
      page,
      limit,
      route: '/post',
    } as IPaginationOptions;

    return await this.postService.getPostsByUserId(uid, state, options);
  }

  @Get('sync/:postId(\\d+)')
  @ApiOkResponse({ type: PostEntityResponse })
  public async getPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.postService.getPost(postId);
  }

  @Post('sync/:postId(\\d+)/ignore')
  @ApiCreatedResponse({ type: PostEntityResponse })
  public async setPostIgnored(
    @User('id', ParseIntPipe) uid: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.postService.setPostState(postId, PostState.Ignored);
  }

  @Get('sync/:platform/state')
  @ApiOkResponse({
    type: SyncStateResponse,
  })
  @ApiBadRequestResponse({
    type: InvalidPlatformException,
    description: 'When platform is invalid',
  })
  public async getSyncState(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform', ParsePlatformPipe) platform: string,
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

  @Post('sync/:platform')
  @ApiForbiddenResponse({
    type: EmptyAccessTokenException,
    description: 'When request user has no any access tokens',
  })
  @ApiConflictResponse({
    type: PostSyncingException,
    description: 'When spider is triggered but not completed',
  })
  @ApiBadRequestResponse({
    type: InvalidPlatformException,
    description: 'When platform is invalid',
  })
  public async triggerPostSync(
    @User('id', ParseIntPipe) uid: number,
    @Param('platform', ParsePlatformPipe) platform: string,
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

  // @Post(':postId(\\d+)/publish')
  // @ApiCreatedResponse({ type: PostEntityResponse })
  // async publishPost(
  //   @User() user: UCenterJWTPayload,
  //   @Param('postId', ParseIntPipe) postId: number,
  //   @Body() body: PublishPostDto,
  // ) {
  //   return await this.postService.publishPendingPost(user, postId, body);
  // }

  // @Post('publish')
  // @ApiCreatedResponse({ type: PostEntityResponse })
  // @ApiBadRequestResponse({
  //   type: RequirdHttpHeadersNotFoundException,
  //   description: 'When cookie with access token not provided',
  // })
  // async publishPosts(
  //   @User() user: UCenterJWTPayload,
  //   @Body() body: PublishPostsDto,
  // ) {
  //   return await this.postService.publishPendingPosts(user, body);
  // }

  // @Post('delete')
  // @ApiCreatedResponse({ type: PostEntityResponse })
  // @ApiBadRequestResponse({
  //   type: RequirdHttpHeadersNotFoundException,
  //   description: 'When cookie with access token not provided',
  // })
  // async deletePosts(
  //   @User() user: UCenterJWTPayload,
  //   @Body() body: PublishPostsDto,
  // ) {
  //   return await this.postService.deletePublishedPosts(user, body);
  // }

  // @Post(':postId(\\d+)/draft')
  // @ApiCreatedResponse({ type: PostEntityResponse })
  // async getDraftOfPost(@Param('postId', ParseIntPipe) postId: number) {
  //   return await this.postService.makeDraft(postId);
  // }

  // @Post()
  // @ApiCreatedResponse({ type: PostEntityResponse })
  // async createDraftPost(
  //   @User('id', ParseIntPipe) uid: number,
  //   @Body(new ValidationPipe({ whitelist: true })) dto: DraftPostCreationDto,
  // ) {
  //   return await this.postService.createPost(uid, dto);
  // }

  // @Patch(':postId(\\d+)')
  // @ApiOkResponse({ type: PostEntityResponse })
  // async updateDraftPost(
  //   @Param('postId', ParseIntPipe) postId: number,
  //   @Body(new ValidationPipe({ whitelist: true })) dto: DraftPostUpdateDto,
  // ) {
  //   return await this.postService.updatePost(postId, dto);
  // }
}
