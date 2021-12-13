import { AuthorPostSignatureMetadata } from '@metaio/meta-signature-util';
import { MetaWorker } from '@metaio/worker-model';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import han from 'han';
import omit from 'lodash.omit';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { lastValueFrom } from 'rxjs';
import { PartialDeep } from 'type-fest';
import { In, Repository, UpdateResult } from 'typeorm';

import { CACHE_KEY_PUB_TARGET_URL } from '../../constants';
import { DraftEntity } from '../../entities/draft.entity';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import {
  AccessDeniedException,
  InvalidStatusException,
} from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import {
  MetadataStorageType,
  PostAction,
  PostState,
  TaskCommonState,
  TaskEvent,
} from '../../types/enum';
import { iso8601ToDate } from '../../utils';
import { isEachType } from '../../utils/typeGuard';
import { AppCacheService } from '../cache/service';
import { MetaSignatureHelper } from '../meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../meta-signature/meta-signature.service';
import { PublisherService } from '../provider/publisher/publisher.service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { TasksService } from '../task/tasks.service';
import { StoragePostDto } from './dto/post.dto';
import { PublishStoragePostsDto } from './dto/publish-post.dto';
import { PreProcessorService } from './preprocessor/preprocessor.service';

export type PostEntityLike = Omit<PostEntity, 'id' | 'siteConfigRelas'>;

type HexoPostsAPIPathObject = {
  name: string;
  path: string;
};
type HexoPostsAPIData = {
  [key: string]:
    | string
    | number
    | boolean
    | Array<string | number | HexoPostsAPIPathObject>;
  title: string;
  slug: string;
  date: string;
  updated: string;
  comments: boolean;
  path: string;
  excerpt: string;
  keywords: string[];
  cover: string;
  content: string;
  raw: string;
  categories: HexoPostsAPIPathObject[];
  tags: HexoPostsAPIPathObject[];
};
export type HexoPostsAPIResponse = {
  total: number;
  pageSize: number;
  pageCount: number;
  data: Partial<HexoPostsAPIData>[];
};

export interface DraftPost extends PostEntity {
  content: string;
}

@Injectable()
export class PostService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(PostSiteConfigRelaEntity)
    private readonly postSiteConfigRepository: Repository<PostSiteConfigRelaEntity>,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly publisherService: PublisherService,
    private readonly preprocessorService: PreProcessorService,
    private readonly tasksService: TasksService,
    @InjectRepository(DraftEntity)
    private readonly draftRepository: Repository<DraftEntity>,
    private readonly metaSignatureService: MetaSignatureService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
    private readonly cache: AppCacheService,
    private readonly httpService: HttpService,
  ) {}

  private setPostMetadata(
    post: PostEntity,
    authorDigestRequestMetadataStorageType: MetadataStorageType,
    authorDigestRequestMetadataRefer: string,
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
    authorDigestSignatureMetadata: AuthorPostSignatureMetadata,
    authorDigestSignWithContentServerVerificationMetadataRefer: string,
  ) {
    if (authorDigestRequestMetadataStorageType) {
      post.authorDigestRequestMetadataStorageType =
        authorDigestRequestMetadataStorageType;
    }
    if (authorDigestSignatureMetadataStorageType) {
      // 服务端签名和作者签名的 metadata 用一样的 storageType
      post.serverVerificationMetadataStorageType =
        post.authorDigestSignatureMetadataStorageType =
          authorDigestSignatureMetadataStorageType;
    }
    if (authorDigestRequestMetadataRefer) {
      post.authorDigestRequestMetadataRefer = authorDigestRequestMetadataRefer;
    }
    if (authorDigestSignatureMetadataRefer) {
      post.authorDigestSignatureMetadataRefer =
        authorDigestSignatureMetadataRefer;
    }
    if (authorDigestSignWithContentServerVerificationMetadataRefer) {
      post.serverVerificationMetadataRefer =
        authorDigestSignWithContentServerVerificationMetadataRefer;
    }
    if (
      authorDigestSignatureMetadata &&
      authorDigestSignatureMetadata.publicKey
    ) {
      post.authorPublicKey = authorDigestSignatureMetadata.publicKey;
    }
  }

  private async generatePostServerVerificationMetadata(
    userId: number,
    {
      title,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
    }: StoragePostDto,
  ): Promise<{
    authorDigestSignatureMetadata: AuthorPostSignatureMetadata;
    authorDigestSignWithContentServerVerificationMetadataRefer: string;
  }> {
    const verificationKey = this.metaSignatureHelper.createPostVerificationKey(
      userId,
      title,
    );
    const {
      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadataRefer,
    } = await this.metaSignatureService.generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
      verificationKey,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
    );
    // TODO 写合约，记录生成 authorDigestSignWithContentServerVerificationMetadata的时间戳;
    return {
      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadataRefer,
    };
  }

  private async generatePostFromStoragePostDto(
    userId: number,
    postDto: StoragePostDto,
  ): Promise<PostEntityLike> {
    const post = this.postRepository.create({
      ...postDto,
      userId,
      platform: postDto.platform || 'editor',
      state: postDto.state || PostState.Pending,
    });

    const {
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
    } = postDto;

    const {
      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadataRefer,
    } = await this.generatePostServerVerificationMetadata(userId, postDto);

    this.setPostMetadata(
      post,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,

      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadataRefer,
    );

    return post;
  }

  /**
   * @param post is generated by `generatePostFromStoragePostDto`.
   */
  private async generatePostInfoFromStoragePostEntity(
    post: PostEntityLike,
  ): Promise<MetaWorker.Info.Post> {
    const {
      source,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
      serverVerificationMetadataStorageType,
      serverVerificationMetadataRefer,
      createdAt,
      updatedAt,
    } = post;
    const processedContent = await this.preprocessorService.preprocess(source);
    const postInfo: MetaWorker.Info.Post = {
      title: post.title,
      source: processedContent,
      cover: post.cover,
      summary: post.summary,
      categories: post.categories,
      tags: post.tags,
      license: post.license,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
      serverVerificationMetadataStorageType,
      serverVerificationMetadataRefer,
      createdAt: iso8601ToDate(createdAt).toISOString(),
      updatedAt: iso8601ToDate(updatedAt).toISOString(),
    };
    // Change title
    if (post.titleInStorage && post.titleInStorage !== post.title) {
      postInfo.title = post.titleInStorage;
      postInfo.META_SPACE_INTERNAL_NEW_TITLE = post.title;
    }
    return postInfo;
  }

  private async commonStoragePostsProcess(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
  ): Promise<PostEntityLike[]> {
    const { configIds, posts } = publishPostDto;
    // Validate site config ids
    await this.siteConfigLogicService.validateSiteConfigsUserId(
      configIds,
      user.id,
    );
    // Create post entities
    this.logger.verbose(
      `Create post entities from StoragePostDtos`,
      this.constructor.name,
    );
    const postEntities = await Promise.all(
      posts.map(
        async (post) =>
          await this.generatePostFromStoragePostDto(user.id, post),
      ),
    );
    return postEntities;
  }

  private async createPostSiteConfigRelas(
    publishPostDto: PublishStoragePostsDto,
    postKey: number | string,
    action: PostAction,
  ): Promise<PostSiteConfigRelaEntity[]> {
    const relas = publishPostDto.configIds.map((configId) => {
      if (typeof postKey === 'number') {
        const rela: PartialDeep<PostSiteConfigRelaEntity> = {
          siteConfig: {
            id: configId,
          },
          post: {
            id: postKey,
          },
          state: TaskCommonState.DOING,
          action,
        };
        return rela;
      } else {
        const rela: PartialDeep<PostSiteConfigRelaEntity> = {
          siteConfig: {
            id: configId,
          },
          postTitle: postKey,
          state: TaskCommonState.DOING,
          action,
        };
        return rela;
      }
    });
    this.logger.verbose(
      `Saving post site config relations post key: ${postKey}`,
      this.constructor.name,
    );

    return await this.postSiteConfigRepository.save(relas);
  }

  private async updatePostSiteConfigRelaStateAndActionBySiteConfigId(
    state: TaskCommonState,
    action: PostAction,
    postKeys: number[] | string[],
    siteConfigId: number,
  ): Promise<UpdateResult> {
    if (isEachType(postKeys, 'number')) {
      return await this.postSiteConfigRepository.update(
        {
          siteConfig: {
            id: siteConfigId,
          },
          post: {
            id: In(postKeys),
          },
        },
        {
          state,
          action,
        },
      );
    }
    if (isEachType(postKeys, 'string')) {
      return await this.postSiteConfigRepository.update(
        {
          siteConfig: {
            id: siteConfigId,
          },
          postTitle: In(postKeys),
        },
        {
          state,
          action,
        },
      );
    }
  }

  private async generatePublisherTargetRESTfulURL(
    userId: number,
    siteConfigId: number,
  ): Promise<string> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    const publisher = await this.publisherService.getPublisherConfig(
      config.publisherType,
      config.publisherProviderId,
    );
    const baseDomain =
      this.publisherService.getTargetOriginDomainByPublisherConfig(
        config.publisherType,
        publisher,
      );
    const cache = await this.cache.get<string>(
      `${CACHE_KEY_PUB_TARGET_URL}_${config.publisherProviderId}`,
    );
    if (cache) {
      return cache;
    } else {
      const url = `${baseDomain}/${publisher.repoName}`;
      await this.cache.set<string>(
        `${CACHE_KEY_PUB_TARGET_URL}_${config.publisherProviderId}`,
        url,
        {
          ttl: 60 * 60, // 1hr
        },
      );
      return url;
    }
  }

  private async generatePostInfoFromHexoPostsAPIData(
    data: Partial<HexoPostsAPIData>[],
  ): Promise<MetaWorker.Info.Post[]> {
    if (Array.isArray(data)) {
      return data.map((item) => {
        const { title, categories, tags } = item;
        const obj = omit(item, ['comments']);
        return {
          ...obj,
          title,
          source: item?.content,
          summary: item?.excerpt,
          categories: categories.map((i) => i.name),
          tags: tags.map((i) => i.name),
          createdAt: item?.date,
          updatedAt: item?.updated,
        };
      });
    } else {
      return [];
    }
  }

  private async getPublishedPostsFromStorage(
    userId: number,
    siteConfigId: number,
    page: number,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    const baseUrl = await this.generatePublisherTargetRESTfulURL(
      userId,
      siteConfigId,
    );
    const requestUrl = `${baseUrl}/api/posts/${page}.json`;
    const response =
      this.httpService.get<Partial<HexoPostsAPIResponse>>(requestUrl);
    const { data } = await lastValueFrom(response);
    const { total, pageSize, pageCount } = data;
    const items = await this.generatePostInfoFromHexoPostsAPIData(data.data);
    return {
      meta: {
        itemCount: data?.data?.length || 0,
        totalItems: total || 0,
        itemsPerPage: pageSize || 0,
        totalPages: pageCount || page,
        currentPage: page,
      },
      items,
    };
  }

  public async getPostsFromStorage(
    userId: number,
    siteConfigId: number,
    page = 1,
    isDraft = false,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    if (isDraft) {
      throw new Error('Function not implemented.'); // TODO(550): Draft Support
    } else {
      return await this.getPublishedPostsFromStorage(
        userId,
        siteConfigId,
        page,
      );
    }
  }

  public async publishPostsToStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostEntityLike[]> {
    this.logger.verbose(
      `Call publishPostsToStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
    );
    const postKeys: string[] = postEntities.map((p) =>
      han.letter(p.title, '-'),
    );
    // Check post entities
    postEntities.forEach((post) => {
      if (post.userId !== user.id) {
        throw new AccessDeniedException('access denied, user id inconsistent');
      }
      if (post.title.length === 0) {
        throw new BadRequestException('post title is empty');
      }
      if (
        post.state !== PostState.Pending &&
        post.state !== PostState.PendingEdit
      ) {
        throw new InvalidStatusException('invalid post state');
      }
    });
    // Generate post task worker info
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      await this.createPostSiteConfigRelas(
        publishPostDto,
        han.letter(post.title, '-'),
        PostAction.CREATE,
      );
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      try {
        await this.tasksService.createPost(user, postInfos, configId, {
          isDraft,
          isLastTask: true,
        });
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.SUCCESS,
          PostAction.CREATE,
          postKeys,
          configId,
        );
      } catch (err) {
        this.logger.error(`Create posts fail`, err, this.constructor.name);
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.FAIL,
          PostAction.CREATE,
          postKeys,
          configId,
        );
        throw err;
      }
    }
    // Set post state
    postEntities.forEach((post) =>
      isDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return postEntities;
  }

  public async updatePostsInStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostEntityLike[]> {
    this.logger.verbose(
      `Call updatePostsInStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
    );
    const postKeys: string[] = postEntities.map((p) =>
      han.letter(p.title, '-'),
    );
    // Check post entities
    postEntities.forEach((post) => {
      if (post.userId !== user.id) {
        throw new AccessDeniedException('access denied, user id inconsistent');
      }
      if (post.title.length === 0) {
        throw new BadRequestException('post title is empty');
      }
      if (isDraft && post.state !== PostState.Drafted) {
        throw new InvalidStatusException(
          'Invalid post state: post state must be drafted when update a draft post',
        );
      }
      if (!isDraft && post.state !== PostState.Published) {
        throw new InvalidStatusException(
          'Invalid post state: post state must be published when update a post',
        );
      }
    });
    // Generate post task worker info
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      await this.createPostSiteConfigRelas(
        publishPostDto,
        han.letter(post.title, '-'),
        PostAction.UPDATE,
      );
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      try {
        await this.tasksService.updatePost(user, postInfos, configId, {
          isDraft,
          isLastTask: true,
        });
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.SUCCESS,
          PostAction.UPDATE,
          postKeys,
          configId,
        );
      } catch (err) {
        this.logger.error(`Create posts fail`, err, this.constructor.name);
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.FAIL,
          PostAction.UPDATE,
          postKeys,
          configId,
        );
        throw err;
      }
    }
    // Set post state
    postEntities.forEach((post) =>
      isDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return postEntities;
  }

  public async deletePostsOnStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostEntityLike[]> {
    this.logger.verbose(
      `Call deletePostsOnStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
    );
    const postKeys: string[] = postEntities.map((p) =>
      han.letter(p.title, '-'),
    );
    // Check post entities
    postEntities.forEach((post) => {
      if (post.userId !== user.id) {
        throw new AccessDeniedException('access denied, user id inconsistent');
      }
      if (post.title.length === 0) {
        throw new BadRequestException('post title is empty');
      }
      if (
        post.state !== PostState.Published &&
        post.state !== PostState.Drafted
      ) {
        throw new InvalidStatusException(
          'Invalid post state: post state must be published or drafted when delete a post',
        );
      }
    });
    // Generate post task worker info
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      await this.createPostSiteConfigRelas(
        publishPostDto,
        han.letter(post.title, '-'),
        PostAction.DELETE,
      );
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      try {
        await this.tasksService.deletePost(user, postInfos, configId, {
          isDraft,
          isLastTask: true,
        });
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.SUCCESS,
          PostAction.DELETE,
          postKeys,
          configId,
        );
      } catch (err) {
        this.logger.error(`Delete posts fail`, err, this.constructor.name);
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.FAIL,
          PostAction.DELETE,
          postKeys,
          configId,
        );
        throw err;
      }
    }
    // Set post state is Deleted
    postEntities.forEach((post) => (post.state = PostState.Deleted));
    return postEntities;
  }

  public async movePostsInStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    toDraft = false,
  ): Promise<PostEntityLike[]> {
    // If toDraft is true, call HEXO_MOVETO_DRAFT
    // else call HEXO_PUBLISH_DRAFT
    this.logger.verbose(
      `Call movePostsInStorage, toDraft: ${toDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
    );
    const postKeys: string[] = postEntities.map((p) =>
      han.letter(p.title, '-'),
    );
    // Check post entities
    postEntities.forEach((post) => {
      if (post.userId !== user.id) {
        throw new AccessDeniedException('access denied, user id inconsistent');
      }
      if (post.title.length === 0) {
        throw new BadRequestException('post title is empty');
      }
      if (toDraft && post.state !== PostState.Published) {
        // HEXO_MOVETO_DRAFT
        throw new InvalidStatusException(
          'Invalid post state: post state must be published when move a post to draft',
        );
      }
      if (!toDraft && post.state !== PostState.Drafted) {
        // HEXO_PUBLISH_DRAFT
        throw new InvalidStatusException(
          'Invalid post state: post state must be drafted when publish a draft to post',
        );
      }
    });
    // Generate post task worker info
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      await this.createPostSiteConfigRelas(
        publishPostDto,
        han.letter(post.title, '-'),
        PostAction.UPDATE, // maybe move is an UPDATE action
      );
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      try {
        if (toDraft) {
          await this.tasksService.moveToDraft(user, postInfos, configId, {
            isLastTask: true,
          });
        } else {
          await this.tasksService.publishDraft(user, postInfos, configId, {
            isLastTask: true,
          });
        }
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.SUCCESS,
          PostAction.UPDATE, // maybe move is an UPDATE action
          postKeys,
          configId,
        );
      } catch (err) {
        this.logger.error(`Create posts fail`, err, this.constructor.name);
        await this.updatePostSiteConfigRelaStateAndActionBySiteConfigId(
          TaskCommonState.FAIL,
          PostAction.UPDATE, // maybe move is an UPDATE action
          postKeys,
          configId,
        );
        throw err;
      }
    }
    // Set post state
    postEntities.forEach((post) =>
      toDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return postEntities;
  }

  public async getPostsByUserId(
    userId: number,
    state: PostState,
    options: IPaginationOptions,
  ) {
    return await paginate<PostEntity>(this.postRepository, options, {
      where: {
        userId,
        state,
      },
      relations: ['siteConfigRelas'],
    });
  }

  public async getPost(postId: number) {
    const post = (await this.postRepository.findOneOrFail(postId)) as DraftPost;

    if (post.platform === 'editor') {
      const { content } = await this.draftRepository.findOneOrFail(
        Number(post.source),
      );

      post.content = content;
    }

    return post;
  }

  public async setPostState(postId: number, state: PostState) {
    const post = await this.postRepository.findOneOrFail(postId);
    post.state = state;
    await this.postRepository.save(post);
    return post;
  }

  @OnEvent(TaskEvent.SITE_PUBLISHED)
  async handleSitePublished(event: {
    publishConfig: MetaWorker.Configs.PublishConfig;
    user: Partial<UCenterJWTPayload>;
  }) {
    const { publishConfig } = event;
    const siteConfigId = publishConfig.site.configId;
    this.logger.verbose(
      `Update post state to site_published siteConfigId ${siteConfigId}`,
      this.constructor.name,
    );
    await this.updatePostStateBySiteConfigId(
      PostState.SitePublished,
      siteConfigId,
    );
  }

  async updatePostStateBySiteConfigId(state: PostState, siteConfigId: number) {
    await this.postRepository.update(
      {
        siteConfigRelas: [
          {
            siteConfig: {
              id: siteConfigId,
            },
          },
        ],
      },
      { state },
    );
  }

  // async getPendingPostsByUserId(userId: number, options: IPaginationOptions) {
  //   return await this.getPostsByUserId(userId, PostState.Pending, options);
  // }

  // async publishPendingPost(
  //   user: Partial<UCenterJWTPayload>,
  //   postId: number,
  //   publishPostDto: PublishPostDto,
  //   isDraft = false,
  // ) {
  //   this.logger.verbose(
  //     `Find the post to publish postId: ${postId}`,
  //     this.constructor.name,
  //   );
  //   const post = await this.postRepository.findOneOrFail(postId);
  //   if (post.userId !== user.id) {
  //     throw new AccessDeniedException('access denied, user id inconsistent');
  //   }
  //   if (post.title.length === 0) {
  //     throw new BadRequestException('post title is empty');
  //   }
  //   if (
  //     post.state !== PostState.Pending &&
  //     post.state !== PostState.PendingEdit
  //   ) {
  //     throw new InvalidStatusException('invalid post state');
  //   }
  //   await this.siteConfigLogicService.validateSiteConfigsUserId(
  //     publishPostDto.configIds,
  //     user.id,
  //   );
  //   return await this.doPublishPost(user, post, publishPostDto, {
  //     isDraft,
  //     isLastTask: true,
  //   });
  // }

  // async publishPendingPosts(
  //   user: Partial<UCenterJWTPayload>,
  //   publishPostsDto: PublishPostsDto,
  // ) {
  //   const postIds = publishPostsDto.postIds;
  //   this.logger.verbose(
  //     `Find the post to publish postIds: ${postIds}`,
  //     this.constructor.name,
  //   );
  //   await this.siteConfigLogicService.validateSiteConfigsUserId(
  //     publishPostsDto.configIds,
  //     user.id,
  //   );
  //   const posts = await this.postRepository.findByIds(postIds);
  //   const postInfos = [] as MetaWorker.Info.Post[];
  //   for (const post of posts) {
  //     if (post.userId !== user.id) {
  //       throw new AccessDeniedException('access denied, user id inconsistent');
  //     }
  //     if (post.title.length === 0) {
  //       throw new BadRequestException('post title is empty');
  //     }
  //     if (
  //       post.state !== PostState.Pending &&
  //       post.state !== PostState.PendingEdit
  //     ) {
  //       throw new InvalidStatusException('invalid post state');
  //     }
  //     const postInfo = await this.doGeneratePostInfo(post);
  //     if (!postInfo) {
  //       continue;
  //     }
  //     postInfos.push(postInfo);
  //     await this.doSavePostSiteConfigRelas(publishPostsDto, post.id);
  //   }
  //   for (const siteConfigId of publishPostsDto.configIds) {
  //     try {
  //       await this.tasksService.createPost(user, postInfos, siteConfigId, {
  //         isDraft: false,
  //         isLastTask: true,
  //       });
  //       await this.updatePostSiteRelaStateBySiteConfigId(
  //         TaskCommonState.SUCCESS,
  //         postIds,
  //         siteConfigId,
  //       );
  //     } catch (err) {
  //       this.logger.error(
  //         `Create posts fail: ${postIds}`,
  //         err,
  //         this.constructor.name,
  //       );
  //       await this.updatePostSiteRelaStateBySiteConfigId(
  //         TaskCommonState.FAIL,
  //         postIds,
  //         siteConfigId,
  //       );
  //       throw err;
  //     }
  //   }
  //   posts.forEach((post) => (post.state = PostState.Published));
  //   return await this.postRepository.save(posts);
  // }

  // async deletePublishedPosts(
  //   user: Partial<UCenterJWTPayload>,
  //   publishPostsDto: PublishPostsDto,
  // ) {
  //   const { postIds, configIds } = publishPostsDto;
  //   this.logger.verbose(
  //     `Find the post to delete postIds: ${postIds}`,
  //     this.constructor.name,
  //   );
  //   await this.siteConfigLogicService.validateSiteConfigsUserId(
  //     configIds,
  //     user.id,
  //   );
  //   const posts = await this.postRepository.findByIds(postIds);
  //   // Check post
  //   posts.forEach((post) => {
  //     if (post.userId !== user.id) {
  //       throw new AccessDeniedException('access denied, user id inconsistent');
  //     }
  //     if (post.title.length === 0) {
  //       throw new BadRequestException('post title is empty');
  //     }
  //     if (post.state !== PostState.Published) {
  //       throw new InvalidStatusException('invalid post state');
  //     }
  //   });
  //   const postInfos = [] as MetaWorker.Info.Post[];
  //   for (const post of posts) {
  //     const postInfo = await this.doGeneratePostInfo(post);
  //     if (postInfo) {
  //       postInfos.push(postInfo);
  //     }
  //   }
  //   for (const siteConfigId of configIds) {
  //     try {
  //       await this.tasksService.deletePost(user, postInfos, siteConfigId, {
  //         isDraft: false,
  //         isLastTask: true,
  //       });
  //       await this.updatePostSiteRelaActionBySiteConfigId(
  //         PostAction.DELETE,
  //         postIds,
  //         siteConfigId,
  //       );
  //     } catch (err) {
  //       this.logger.error(
  //         `Delete posts fail: ${postIds}`,
  //         err,
  //         this.constructor.name,
  //       );
  //       // TODO: How to rollback action state
  //       // await this.updatePostSiteRelaActionBySiteConfigId(
  //       //   PostAction.DELETE,
  //       //   postIds,
  //       //   siteConfigId,
  //       // );
  //       throw err;
  //     }
  //   }
  //   posts.forEach((post) => (post.state = PostState.Deleted));
  //   return await this.postRepository.softRemove(posts);
  // }

  // async updatePostSiteRelaStateBySiteConfigId(
  //   state: TaskCommonState,
  //   postIds: number[],
  //   siteConfigId: number,
  // ) {
  //   await this.postSiteConfigRepository.update(
  //     {
  //       siteConfig: {
  //         id: siteConfigId,
  //       },
  //       post: {
  //         id: In(postIds),
  //       },
  //     },
  //     {
  //       state,
  //     },
  //   );
  // }

  // async updatePostSiteRelaActionBySiteConfigId(
  //   action: PostAction,
  //   postIds: number[],
  //   siteConfigId: number,
  // ) {
  //   await this.postSiteConfigRepository.update(
  //     {
  //       siteConfig: {
  //         id: siteConfigId,
  //       },
  //       post: {
  //         id: In(postIds),
  //       },
  //     },
  //     {
  //       action,
  //     },
  //   );
  // }

  // protected async doPublishPost(
  //   user: Partial<UCenterJWTPayload>,
  //   post: PostEntity,
  //   publishPostDto: PublishPostDto,
  //   options: {
  //     isDraft: boolean;
  //     isLastTask: boolean;
  //   },
  // ) {
  //   const postId = post.id;
  //   const postInfo = await this.doGeneratePostInfo(post);
  //   if (!postInfo) {
  //     throw new PublishFailedException();
  //   }
  //   const relas = await this.doSavePostSiteConfigRelas(publishPostDto, postId);
  //   for (let i = 0; i < relas.length; i++) {
  //     const postSiteConfigRela = relas[i];
  //     this.logger.verbose(
  //       ` post to site: ${JSON.stringify(postSiteConfigRela)}`,
  //       this.constructor.name,
  //     );
  //     try {
  //       this.logger.verbose(
  //         `Dispatching post site config relations postId: ${postId}`,
  //         this.constructor.name,
  //       );
  //       await this.tasksService.createPost(
  //         user,
  //         postInfo,
  //         postSiteConfigRela.siteConfig.id,
  //         //  postSiteConfigRela->siteConfig->taskWorkspace, isLastTask scope: workspace
  //         options,
  //       );
  //       postSiteConfigRela.state = TaskCommonState.SUCCESS;
  //       await this.postSiteConfigRepository.save(postSiteConfigRela);
  //     } catch (err) {
  //       this.logger.error(
  //         `Create post fail: ${postId}`,
  //         err,
  //         this.constructor.name,
  //       );
  //       postSiteConfigRela.state = TaskCommonState.FAIL;
  //       await this.postSiteConfigRepository.save(postSiteConfigRela);
  //       throw err;
  //     }
  //   }
  //   post.state = PostState.Published;
  //   // record title in storage for next updating
  //   post.titleInStorage = post.title;
  //   return await this.postRepository.save(post);
  // }

  // protected async doSavePostSiteConfigRelas(
  //   publishPostDto: PublishPostDto,
  //   postId: number,
  // ) {
  //   const relas = publishPostDto.configIds.map(
  //     (configId) =>
  //       ({
  //         siteConfig: {
  //           id: configId,
  //         },
  //         post: {
  //           id: postId,
  //         },
  //         state: TaskCommonState.DOING,
  //       } as Partial<PostSiteConfigRelaEntity>),
  //   );
  //   this.logger.verbose(
  //     `Saving post site config relations postId: ${postId}`,
  //     this.constructor.name,
  //   );
  //   await this.postSiteConfigRepository.save(relas);
  //   return relas;
  // }

  // protected async doGeneratePostInfo(post: PostEntity) {
  //   const postId = post.id;
  //   const sourceService = this.getSourceService(post.platform);
  //   this.logger.verbose(
  //     `Fetching source content postId: ${postId}`,
  //     this.constructor.name,
  //   );
  //   let sourceContent: string;
  //   try {
  //     sourceContent = await sourceService.fetch(post.source);
  //   } catch (err) {
  //     await this.setPostState(post.id, PostState.Invalid);
  //     this.logger.error(
  //       `Failed to get source content of postId: ${postId}`,
  //       err,
  //       this.constructor.name,
  //     );
  //     return null;
  //   }
  //   this.logger.verbose(
  //     `Preprocess source content postId: ${postId}`,
  //     this.constructor.name,
  //   );
  //   const processedContent = await this.preprocessorService.preprocess(
  //     sourceContent,
  //   );
  //   const postInfo = {
  //     title: post.title,
  //     source: processedContent,
  //     cover: post.cover,
  //     summary: post.summary,
  //     categories: post.categories,
  //     tags: post.tags,
  //     license: post.license,
  //     authorDigestRequestMetadataStorageType:
  //       post.authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer: post.authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType:
  //       post.authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer:
  //       post.authorDigestSignatureMetadataRefer,
  //     serverVerificationMetadataStorageType:
  //       post.serverVerificationMetadataStorageType,
  //     serverVerificationMetadataRefer: post.serverVerificationMetadataRefer,
  //     createdAt: post.createdAt.toISOString(),
  //     updatedAt: post.updatedAt.toISOString(),
  //   } as MetaWorker.Info.Post;
  //   // Change title
  //   if (post.titleInStorage && post.titleInStorage !== post.title) {
  //     postInfo.title = post.titleInStorage;
  //     postInfo.META_SPACE_INTERNAL_NEW_TITLE = post.title;
  //   }
  //   return postInfo;
  // }

  // getSourceService(platform: string) {
  //   switch (platform) {
  //     case 'matataki':
  //       return this.matatakiSourceService;
  //     case 'editor':
  //       return this.editorSourceService;
  //     default:
  //       throw new Error('Invalid platform');
  //   }
  // }

  // async makeDraft(postId: number) {
  //   const post = await this.postRepository.findOneOrFail(postId);
  //   const sourceService = this.getSourceService(post.platform);
  //   const content = await sourceService.fetch(post.source);
  //   const draftPost = this.postRepository.create({
  //     userId: post.userId,
  //     title: post.title,
  //     summary: post.summary,
  //     cover: post.cover,
  //     categories: post.categories,
  //     tags: post.tags,
  //     platform: 'editor',
  //     source: await this.createDraft(post.userId, content),
  //     state: PostState.Pending,
  //   });
  //   await this.postRepository.save(draftPost);
  //   return draftPost;
  // }

  // async createPost(
  //   userId: number,
  //   {
  //     content,
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //     ...postDto
  //   }: DraftPostCreationDto,
  // ) {
  //   const verificationKey = this.metaSignatureHelper.createPostVerificationKey(
  //     userId,
  //     postDto.title,
  //   );
  //   const {
  //     authorDigestSignatureMetadata,
  //     authorDigestSignWithContentServerVerificationMetadataRefer,
  //   } = await this.metaSignatureService.generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
  //     verificationKey,
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //   );
  //   // //TODO 写合约，记录生成 authorDigestSignWithContentServerVerificationMetadata的时间戳;
  //   const post = this.postRepository.create(postDto);
  //   post.userId = userId;
  //   post.platform = 'editor';
  //   post.source = await this.createDraft(userId, content);
  //   post.license = postDto.license;
  //   this.setPostMetadata(
  //     post,
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //     authorDigestSignatureMetadata,
  //     authorDigestSignWithContentServerVerificationMetadataRefer,
  //   );
  //   post.state = PostState.Pending;
  //   await this.postRepository.save(post);
  //   return post;
  // }
  // async updatePost(postId: number, dto: DraftPostUpdateDto) {
  //   const post = (await this.postRepository.findOneOrFail(postId)) as DraftPost;
  //   if (post.platform !== 'editor') {
  //     throw new BadRequestException('post must be of editor platform');
  //   }
  //   const {
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //   } = dto;
  //   const verificationKey = this.metaSignatureHelper.createPostVerificationKey(
  //     post.userId,
  //     post.title,
  //   );
  //   const {
  //     authorDigestSignatureMetadata,
  //     authorDigestSignWithContentServerVerificationMetadataRefer,
  //   } = await this.metaSignatureService.generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
  //     verificationKey,
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //   );
  //   this.setPostMetadata(
  //     post,
  //     authorDigestRequestMetadataStorageType,
  //     authorDigestRequestMetadataRefer,
  //     authorDigestSignatureMetadataStorageType,
  //     authorDigestSignatureMetadataRefer,
  //     authorDigestSignatureMetadata,
  //     authorDigestSignWithContentServerVerificationMetadataRefer,
  //   );
  //   if (typeof dto.content === 'string') {
  //     await this.updateDraft(Number(post.source), dto.content);
  //   }
  //   this.postRepository.merge(post, dto);
  //   if (post.state !== PostState.Pending) {
  //     post.state = PostState.PendingEdit;
  //   }
  //   await this.postRepository.save(post);
  //   if (typeof dto.content === 'string') {
  //     post.content = dto.content;
  //   }
  //   return post;
  // }

  // TODO: Switch to hexo storage
  // async createDraft(userId: number, content: string) {
  //   if (typeof content !== 'string') {
  //     return 'local';
  //   }
  //   const draft = this.draftRepository.create({ userId, content });
  //   await this.draftRepository.save(draft);
  //   return draft.id.toString();
  // }

  // async updateDraft(draftId: number, content: string) {
  //   const draft = await this.draftRepository.findOneOrFail(draftId);
  //   draft.content = content;
  //   await this.draftRepository.save(draft);
  // }
}
