import { AuthorPostSignatureMetadata } from '@metaio/meta-signature-util';
import { MetaWorker } from '@metaio/worker-model';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { parse as yfmParse } from 'hexo-front-matter';
import omit from 'lodash.omit';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import path from 'path';
import { lastValueFrom } from 'rxjs';
import { PartialDeep } from 'type-fest';
import { Repository } from 'typeorm';

import { AppCacheService } from '../../cache/service';
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
  GetPostsFromStorageState,
  MetadataStorageType,
  PostAction,
  PostState,
  TaskCommonState,
} from '../../types/enum';
import { iso8601ToDate, processTitleWithHan } from '../../utils';
import { MetaSignatureHelper } from '../meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../meta-signature/meta-signature.service';
import { PublisherService } from '../provider/publisher/publisher.service';
import { StorageService } from '../provider/storage/service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { PostTasksService } from '../task/post.tasks.service';
import { StoragePostDto } from './dto/post.dto';
import { PublishStoragePostsDto } from './dto/publish-post.dto';
import { PreProcessorService } from './preprocessor/preprocessor.service';

type PublishedPostsFromStorageDirectlyResult = {
  items: MetaWorker.Info.Post[];
  total: number;
  pageSize: number;
  pageCount: number;
};

export type PostEntityLike = Omit<PostEntity, 'id'>;

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

export type HexoFrontMatterParseObject = {
  [key: string]: string | number | Array<string | number>;
  title: string;
  tags: string[];
  updated: string;
  categories: string[];
  excerpt: string;
  cover: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  _content: string;
};

export type PostsTaskResult = {
  posts: PostEntityLike[];
  stateIds: number[];
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
    private readonly storageService: StorageService,
    private readonly preprocessorService: PreProcessorService,
    private readonly tasksService: PostTasksService,
    @InjectRepository(DraftEntity)
    private readonly draftRepository: Repository<DraftEntity>,
    private readonly metaSignatureService: MetaSignatureService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
    private readonly cache: AppCacheService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      // ????????????????????????????????? metadata ???????????? storageType
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
    // TODO ???????????????????????? authorDigestSignWithContentServerVerificationMetadata????????????;
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
    postKey: string,
    action: PostAction,
  ): Promise<PostSiteConfigRelaEntity[]> {
    const relas = publishPostDto.configIds.map((configId) => {
      const rela: PartialDeep<PostSiteConfigRelaEntity> = {
        siteConfig: {
          id: configId,
        },
        postTitle: postKey,
        state: TaskCommonState.TODO,
        action,
      };
      return rela;
    });
    this.logger.verbose(
      `Saving post site config relations post key: ${postKey}`,
      this.constructor.name,
    );
    return await this.postSiteConfigRepository.save(relas);
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
    const cacheKey = `${CACHE_KEY_PUB_TARGET_URL}_${config.publisherProviderId}`;
    const cache = await this.cache.get<string>(cacheKey);
    if (cache) {
      return cache;
    } else {
      const url = `https://${baseDomain}/${publisher.repoName}`;
      await this.cache.set<string>(cacheKey, url, {
        ttl: 60 * 60, // 1hr
      });
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

  private async getStorageGitInfoAndType(
    userId: number,
    siteConfigId: number,
  ): Promise<{
    info: MetaWorker.Info.Git;
    type: MetaWorker.Enums.StorageType;
  }> {
    const config = await this.siteConfigLogicService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    const { storeProviderId, storeType } = config;
    const { gitInfo } = await this.storageService.getMetaWorkerGitInfo(
      storeType,
      userId,
      storeProviderId,
    );
    return { info: gitInfo, type: storeType };
  }

  private async generateHexoFrontMatterParseList(
    userId: number,
    siteConfigId: number,
    findPath: string,
  ): Promise<HexoFrontMatterParseObject[]> {
    const { info, type } = await this.getStorageGitInfoAndType(
      userId,
      siteConfigId,
    );
    const treeList = await this.storageService.getGitTreeList(
      type,
      info,
      findPath,
      'blob',
    );
    const blobList = await this.storageService.getGitBlobsByTreeList(
      type,
      info,
      treeList,
      true,
    );
    const parsed = blobList.map((blob) => {
      if (blob.content && blob.encoding === 'utf-8') {
        const parsed = yfmParse(blob.content);
        return {
          ...parsed,
          slug: blob.path ? path.parse(blob.path).name : '',
        } as HexoFrontMatterParseObject;
      }
    });
    return parsed;
  }

  private async generatePostInfoHexoFrontMatterParseList(
    data: HexoFrontMatterParseObject[],
  ): Promise<MetaWorker.Info.Post[]> {
    if (Array.isArray(data)) {
      return data.map((item) => {
        const obj = {
          ...item,
          source: item?._content,
          summary: item?.excerpt,
          createdAt: item?.createdAt || item?.date,
          updatedAt: item?.updatedAt || item?.updated,
        };
        obj._content = undefined;
        obj.excerpt = undefined;
        return obj;
      });
    } else {
      return [];
    }
  }

  private async getDraftedPostsFromStorageDirectly(
    userId: number,
    siteConfigId: number,
  ): Promise<MetaWorker.Info.Post[]> {
    const hexoList = await this.generateHexoFrontMatterParseList(
      userId,
      siteConfigId,
      'source/_drafts',
    );
    const items = await this.generatePostInfoHexoFrontMatterParseList(hexoList);
    return items;
  }

  private async getDraftedPostsFromStorage(
    userId: number,
    siteConfigId: number,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    const items = await this.getDraftedPostsFromStorageDirectly(
      userId,
      siteConfigId,
    );
    return {
      meta: {
        itemCount: items.length || 0,
        totalItems: items.length || 0,
        itemsPerPage: items.length || 0,
        totalPages: 1,
        currentPage: 1,
      },
      items,
    };
  }

  private async getPostedPostsFromStorageDirectly(
    userId: number,
    siteConfigId: number,
  ): Promise<MetaWorker.Info.Post[]> {
    const hexoList = await this.generateHexoFrontMatterParseList(
      userId,
      siteConfigId,
      'source/_posts',
    );
    const items = await this.generatePostInfoHexoFrontMatterParseList(hexoList);
    return items;
  }

  private async getPostedPostsFromStorage(
    userId: number,
    siteConfigId: number,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    const items = await this.getPostedPostsFromStorageDirectly(
      userId,
      siteConfigId,
    );
    return {
      meta: {
        itemCount: items.length || 0,
        totalItems: items.length || 0,
        itemsPerPage: items.length || 0,
        totalPages: 1,
        currentPage: 1,
      },
      items,
    };
  }

  private async getPublishedPostsFromStorageDirectly(
    userId: number,
    siteConfigId: number,
    page: number,
  ): Promise<PublishedPostsFromStorageDirectlyResult> {
    const baseUrl = await this.generatePublisherTargetRESTfulURL(
      userId,
      siteConfigId,
    );
    const requestUrl =
      page === 1
        ? `${baseUrl}/api/posts.json`
        : `${baseUrl}/api/posts/${page}.json`;
    const response =
      this.httpService.get<Partial<HexoPostsAPIResponse>>(requestUrl);
    const { data } = await lastValueFrom(response);
    const { total, pageSize, pageCount } = data;
    const items = await this.generatePostInfoFromHexoPostsAPIData(data.data);
    return {
      items,
      total,
      pageSize,
      pageCount,
    };
  }

  private async getPublishedPostsFromStorage(
    userId: number,
    siteConfigId: number,
    page: number,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    const { items, total, pageSize, pageCount } =
      await this.getPublishedPostsFromStorageDirectly(
        userId,
        siteConfigId,
        page,
      );
    return {
      meta: {
        itemCount: items.length || 0,
        totalItems: total || 0,
        itemsPerPage: pageSize || 0,
        totalPages: pageCount || page,
        currentPage: page,
      },
      items,
    };
  }

  private async getAllPublishedPostsFromStorage(
    userId: number,
    siteConfigId: number,
  ): Promise<MetaWorker.Info.Post[]> {
    const { items, pageCount } =
      await this.getPublishedPostsFromStorageDirectly(userId, siteConfigId, 1);
    const result: MetaWorker.Info.Post[] = Array.from(items);
    for (let current = 2; pageCount >= current; current++) {
      try {
        const { items } = await this.getPublishedPostsFromStorageDirectly(
          userId,
          siteConfigId,
          current,
        );
        result.push(...items);
      } catch {
        continue;
      }
    }
    return result;
  }

  public async getPostsFromStorage(
    userId: number,
    siteConfigId: number,
    state: GetPostsFromStorageState = GetPostsFromStorageState.Published,
    page = 1,
  ): Promise<Pagination<MetaWorker.Info.Post>> {
    const wrongData: Pagination<MetaWorker.Info.Post> = {
      meta: {
        itemCount: 0,
        totalItems: 0,
        itemsPerPage: 0,
        totalPages: 0,
        currentPage: 0,
      },
      items: [],
    };
    try {
      if (state === GetPostsFromStorageState.Drafted) {
        return await this.getDraftedPostsFromStorage(userId, siteConfigId);
      }
      if (state === GetPostsFromStorageState.Posted) {
        return await this.getPostedPostsFromStorage(userId, siteConfigId);
      }
      if (state === GetPostsFromStorageState.Published) {
        return await this.getPublishedPostsFromStorage(
          userId,
          siteConfigId,
          page,
        );
      }
      return wrongData;
    } catch (error) {
      this.logger.error(
        `Call getPostsFromStorage ${error}`,
        error,
        this.constructor.name,
      );
      return wrongData;
    }
  }

  public async getAllPostsFromStorage(
    userId: number,
    siteConfigId: number,
    state: GetPostsFromStorageState = GetPostsFromStorageState.Published,
  ): Promise<MetaWorker.Info.Post[]> {
    switch (state) {
      case GetPostsFromStorageState.Drafted:
        return await this.getDraftedPostsFromStorageDirectly(
          userId,
          siteConfigId,
        );
      case GetPostsFromStorageState.Posted:
        return await this.getPostedPostsFromStorageDirectly(
          userId,
          siteConfigId,
        );
      case GetPostsFromStorageState.Published:
        return await this.getAllPublishedPostsFromStorage(userId, siteConfigId);
    }
  }

  public async publishPostsToStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostsTaskResult> {
    this.logger.verbose(
      `Call publishPostsToStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
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
        throw new InvalidStatusException(`invalid post state ${post.state}`);
      }
    });
    // Generate post task worker info
    const postInfos: MetaWorker.Info.Post[] = [];
    const historys: PostSiteConfigRelaEntity[] = [];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      const hanTitle = processTitleWithHan(postInfo.title);
      const relas = await this.createPostSiteConfigRelas(
        publishPostDto,
        hanTitle,
        PostAction.CREATE,
      );
      historys.push(...relas);
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      await this.tasksService.createPost(user, postInfos, configId, {
        isDraft,
        isLastTask: true,
      });
    }
    // Set post state
    postEntities.forEach((post) =>
      isDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return {
      posts: postEntities,
      stateIds: historys.map((h) => h.id),
    };
  }

  public async updatePostsInStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostsTaskResult> {
    this.logger.verbose(
      `Call updatePostsInStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
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
    const postInfos: MetaWorker.Info.Post[] = [];
    const historys: PostSiteConfigRelaEntity[] = [];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      const hanTitle = processTitleWithHan(postInfo.title);
      const relas = await this.createPostSiteConfigRelas(
        publishPostDto,
        hanTitle,
        PostAction.UPDATE,
      );
      historys.push(...relas);
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      await this.tasksService.updatePost(user, postInfos, configId, {
        isDraft,
        isLastTask: true,
      });
    }
    // Set post state
    postEntities.forEach((post) =>
      isDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return {
      posts: postEntities,
      stateIds: historys.map((h) => h.id),
    };
  }

  public async deletePostsOnStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    isDraft = false,
  ): Promise<PostsTaskResult> {
    this.logger.verbose(
      `Call deletePostsOnStorage, isDraft: ${isDraft}`,
      this.constructor.name,
    );
    const postEntities = await this.commonStoragePostsProcess(
      user,
      publishPostDto,
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
    const postInfos: MetaWorker.Info.Post[] = [];
    const historys: PostSiteConfigRelaEntity[] = [];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      const hanTitle = processTitleWithHan(postInfo.title);
      const relas = await this.createPostSiteConfigRelas(
        publishPostDto,
        hanTitle,
        PostAction.DELETE,
      );
      historys.push(...relas);
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      await this.tasksService.deletePost(user, postInfos, configId, {
        isDraft,
        isLastTask: true,
      });
    }
    // Set post state is Deleted
    postEntities.forEach((post) => (post.state = PostState.Deleted));
    return {
      posts: postEntities,
      stateIds: historys.map((h) => h.id),
    };
  }

  public async movePostsInStorage(
    user: Partial<UCenterJWTPayload>,
    publishPostDto: PublishStoragePostsDto,
    toDraft = false,
  ): Promise<PostsTaskResult> {
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
    const postInfos: MetaWorker.Info.Post[] = [];
    const historys: PostSiteConfigRelaEntity[] = [];
    for (const post of postEntities) {
      const postInfo = await this.generatePostInfoFromStoragePostEntity(post);
      postInfos.push(postInfo);
      const hanTitle = processTitleWithHan(postInfo.title);
      const relas = await this.createPostSiteConfigRelas(
        publishPostDto,
        hanTitle,
        PostAction.UPDATE, // maybe move is an UPDATE action
      );
      historys.push(...relas);
    }
    // Create post task
    for (const configId of publishPostDto.configIds) {
      if (toDraft) {
        await this.tasksService.moveToDraft(user, postInfos, configId, {
          isLastTask: true,
        });
      } else {
        await this.tasksService.publishDraft(user, postInfos, configId, {
          isLastTask: true,
        });
      }
    }
    // Set post state
    postEntities.forEach((post) =>
      toDraft
        ? (post.state = PostState.Drafted)
        : (post.state = PostState.Published),
    );
    return {
      posts: postEntities,
      stateIds: historys.map((h) => h.id),
    };
  }

  public async getStorageTaskState(
    userId: number,
    stateIds: number[],
  ): Promise<PostSiteConfigRelaEntity[]> {
    const states = await this.postSiteConfigRepository.findByIds(stateIds, {
      relations: ['siteConfig'],
    });
    const siteConfigs = states.map((s) => s.siteConfig);
    const siteCconfigIds = siteConfigs.map((s) => s.id);
    await this.siteConfigLogicService.validateSiteConfigsUserId(
      siteCconfigIds,
      userId,
    );
    return states;
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

  public async setPostState(userId: number, postId: number, state: PostState) {
    const post = await this.postRepository.findOneOrFail(postId);
    if (post.userId !== userId) {
      throw new AccessDeniedException('access denied, user id inconsistent');
    }
    post.state = state;
    await this.postRepository.save(post);
    return post;
  }

  public decryptMatatakiPost(iv: Buffer, encryptedData: Buffer) {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.configService.get<string>('post.matataki.key'), 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
