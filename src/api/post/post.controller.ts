import { MetaWorker } from '@metaio/worker-model';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseEnumPipe,
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

import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import {
  EmptyAccessTokenException,
  InvalidPlatformException,
  PostSyncingException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { ParsePlatformPipe } from '../../pipes/parse-platform.pipe';
import { UCenterJWTPayload } from '../../types';
import {
  GetPostsFromStorageState,
  MetaMicroserviceClient,
  PostState,
} from '../../types/enum';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { PostMethodValidation } from '../../utils/validation';
import { AccessTokenService } from '../synchronizer/access-token.service';
import { EncryptedDataDto } from './dto/encrypted-data-dto';
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
class PostInfoPagination extends PaginationResponse<MetaWorker.Info.Post> {
  readonly items: MetaWorker.Info.Post[];
}
class PostInfoListResponse extends TransformResponse<PostInfoPagination> {
  @ApiProperty({ type: PostInfoPagination })
  readonly data: PostInfoPagination;
}
class PostEntitiesResponse {
  posts: PostEntity[];
  stateIds: number[];
}
/**
 * {
 *   "data": {
 *     "posts": [
 *       {
 *         "createdAt": "2021-12-06T09:15:50.574Z",
 *         "userId": 19,
 *         "title": "POST API ?????? 006",
 *         "platform": "editor",
 *         "source": "POST API ????????????",
 *         "state": "published"
 *       }
 *     ],
 *     "stateIds": [
 *       265
 *     ]
 *   },
 *   "statusCode": 201,
 *   "message": "Ok"
 * }
 */
class PostEntitiesAndStateListResponse extends TransformResponse<PostEntitiesResponse> {
  @ApiProperty({ type: PostEntitiesResponse })
  readonly data: PostEntitiesResponse;
}
class PostStorageTaskStateResponse extends TransformResponse<
  PostSiteConfigRelaEntity[]
> {
  @ApiProperty({ type: PostSiteConfigRelaEntity, isArray: true })
  readonly data: PostSiteConfigRelaEntity[];
}
class SyncStateResponse extends TransformResponse<'idle' | 'syncing' | number> {
  @ApiProperty({ type: String, example: 'idle | syncing | 1' })
  readonly data: 'idle' | 'syncing' | number;
}
class MatatakiDecryptedPostResponse extends TransformResponse<string> {
  @ApiProperty({ type: String })
  readonly data: string;
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

  @Get('storage/state')
  @ApiOkResponse({ type: PostStorageTaskStateResponse })
  @ApiQuery({
    name: 'stateIds',
    isArray: true,
    example: [1, 2, 3],
  })
  public async getStorageTaskState(
    @User('id', ParseIntPipe) uid: number,
    @Query('stateIds', new ParseArrayPipe({ items: Number }))
    stateIds: number[],
  ) {
    return await this.postService.getStorageTaskState(uid, stateIds);
  }

  @Get('storage/:siteConfigId(\\d+)')
  @ApiOperation({
    summary: 'Get posts from user storage.',
    description:
      'When state is drafted: private repo _drafts folder; when state is posted: private repo _posted folder; when state is published: public repo RESTful api.',
  })
  @ApiOkResponse({ type: PostInfoListResponse })
  @ApiQuery({
    name: 'state',
    enum: GetPostsFromStorageState,
    example: GetPostsFromStorageState.Published,
  })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  public async getPostsFromStorage(
    @User('id', ParseIntPipe) uid: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Query(
      'state',
      new DefaultValuePipe(GetPostsFromStorageState.Published),
      new ParseEnumPipe(GetPostsFromStorageState, {}),
    )
    state?: GetPostsFromStorageState,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
  ) {
    return await this.postService.getPostsFromStorage(
      uid,
      siteConfigId,
      state,
      page,
    );
  }

  @Post('storage/publish')
  @ApiOperation({
    summary:
      'Publish posts to user storage, state must be pending or pending_edit.',
    description:
      'If draft is true, post will publish as draft. For example: in Hexo platform, when draft is set true, will create a post file in _drafts folder.',
  })
  @ApiQuery({ name: 'draft', type: Boolean, example: false })
  @ApiCreatedResponse({ type: PostEntitiesAndStateListResponse })
  @ApiConflictResponse({
    description: 'When post state is not pending or pending_edit.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async publishPostsToStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', new DefaultValuePipe(false), ParseBoolPipe) draft: boolean,
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
  @ApiCreatedResponse({ type: PostEntitiesAndStateListResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async updatePostsToStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', new DefaultValuePipe(false), ParseBoolPipe) draft: boolean,
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
  @ApiCreatedResponse({ type: PostEntitiesAndStateListResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async deletePostOnStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', new DefaultValuePipe(false), ParseBoolPipe) draft: boolean,
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
  @ApiCreatedResponse({ type: PostEntitiesAndStateListResponse })
  @ApiConflictResponse({
    description: 'When post state is not published or drafted.',
  })
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async movePostsInStorage(
    @User() user: UCenterJWTPayload,
    @Query('draft', new DefaultValuePipe(false), ParseBoolPipe) draft: boolean,
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query(
      'state',
      new DefaultValuePipe(PostState.Pending),
      new ParseEnumPipe(PostState),
    )
    state: PostState,
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
    return await this.postService.setPostState(uid, postId, PostState.Ignored);
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

  @Post('decrypt/matataki')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MatatakiDecryptedPostResponse })
  public decryptMatatakiPost(@Body() dto: EncryptedDataDto) {
    const iv = Buffer.from(dto.iv, 'hex');
    const encryptedData = Buffer.from(dto.encryptedData, 'hex');

    return JSON.parse(this.postService.decryptMatatakiPost(iv, encryptedData));
  }
}
