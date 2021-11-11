import { AuthorSignatureMetadata } from '@metaio/meta-signature-util/type/types';
import { MetaWorker } from '@metaio/worker-model';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createPrivateKey, createPublicKey, sign } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { In, Repository } from 'typeorm';

import { TaskEvent } from '../../constants';
import { DraftEntity } from '../../entities/draft.entity';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import {
  AccessDeniedException,
  InvalidStatusException,
  PublishFailedException,
  ValidationException,
} from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import {
  MetadataStorageType,
  PostState,
  TaskCommonState,
} from '../../types/enum';
import { MetaSignatureHelper } from '../meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../meta-signature/meta-signature.service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { TasksService } from '../task/tasks.service';
import { DraftPostCreationDto, DraftPostUpdateDto } from './dto/draft-post-dto';
import { PublishPostDto, PublishPostsDto } from './dto/publish-post.dto';
import { PreProcessorService } from './preprocessor/preprocessor.service';
import { EditorSourceService } from './sources/editor/editor-source.service';
import { MatatakiSourceService } from './sources/matataki/matataki-source.service';

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
    private readonly preprocessorService: PreProcessorService,
    private readonly matatakiSourceService: MatatakiSourceService,
    private readonly tasksService: TasksService,
    @InjectRepository(DraftEntity)
    private readonly draftRepository: Repository<DraftEntity>,
    private readonly editorSourceService: EditorSourceService,
    private readonly metaSignatureService: MetaSignatureService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
  ) {}

  async getPostsByUserId(
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

  async getPendingPostsByUserId(userId: number, options: IPaginationOptions) {
    return await this.getPostsByUserId(userId, PostState.Pending, options);
  }

  async setPostState(postId: number, state: PostState) {
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

  async publishPendingPost(
    user: Partial<UCenterJWTPayload>,
    postId: number,
    publishPostDto: PublishPostDto,
    isDraft = false,
  ) {
    this.logger.verbose(
      `Find the post to publish postId: ${postId}`,
      this.constructor.name,
    );

    const post = await this.postRepository.findOneOrFail(postId);
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

    await this.siteConfigLogicService.validateSiteConfigsUserId(
      publishPostDto.configIds,
      user.id,
    );

    return await this.doPublishPost(user, post, publishPostDto, {
      isDraft,
      isLastTask: true,
    });
  }

  async publishPendingPosts(
    user: Partial<UCenterJWTPayload>,
    publishPostsDto: PublishPostsDto,
  ) {
    const postIds = publishPostsDto.postIds;

    this.logger.verbose(
      `Find the post to publish postIds: ${postIds}`,
      this.constructor.name,
    );

    await this.siteConfigLogicService.validateSiteConfigsUserId(
      publishPostsDto.configIds,
      user.id,
    );

    const posts = await this.postRepository.findByIds(postIds);
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of posts) {
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
      const postInfo = await this.doGeneratePostInfo(post);
      if (!postInfo) {
        continue;
      }
      postInfos.push(postInfo);
      await this.doSavePostSiteConfigRelas(publishPostsDto, post.id);
    }
    for (const siteConfigId of publishPostsDto.configIds) {
      try {
        await this.tasksService.createPost(user, postInfos, siteConfigId, {
          isDraft: false,
          isLastTask: true,
        });
        await this.updatePostSiteRelaStateBySiteConfigId(
          TaskCommonState.SUCCESS,
          postIds,
          siteConfigId,
        );
      } catch (err) {
        this.logger.error(
          `Create posts fail: ${postIds}`,
          err,
          this.constructor.name,
        );
        await this.updatePostSiteRelaStateBySiteConfigId(
          TaskCommonState.FAIL,
          postIds,
          siteConfigId,
        );
        throw err;
      }
    }
    posts.forEach((post) => (post.state = PostState.Published));
    return await this.postRepository.save(posts);
  }
  async updatePostSiteRelaStateBySiteConfigId(
    state: TaskCommonState,
    postIds: number[],
    siteConfigId: number,
  ) {
    await this.postSiteConfigRepository.update(
      {
        siteConfig: {
          id: siteConfigId,
        },
        post: {
          id: In(postIds),
        },
      },
      {
        state,
      },
    );
  }

  protected async doPublishPost(
    user: Partial<UCenterJWTPayload>,
    post: PostEntity,
    publishPostDto: PublishPostDto,
    options: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ) {
    const postId = post.id;

    const postInfo = await this.doGeneratePostInfo(post);
    if (!postInfo) {
      throw new PublishFailedException();
    }

    const relas = await this.doSavePostSiteConfigRelas(publishPostDto, postId);
    for (let i = 0; i < relas.length; i++) {
      const postSiteConfigRela = relas[i];
      this.logger.verbose(
        ` post to site: ${JSON.stringify(postSiteConfigRela)}`,
        this.constructor.name,
      );

      try {
        this.logger.verbose(
          `Dispatching post site config relations postId: ${postId}`,
          this.constructor.name,
        );
        await this.tasksService.createPost(
          user,
          postInfo,
          postSiteConfigRela.siteConfig.id,
          //  postSiteConfigRela->siteConfig->taskWorkspace, isLastTask scope: workspace
          options,
        );
        postSiteConfigRela.state = TaskCommonState.SUCCESS;
        await this.postSiteConfigRepository.save(postSiteConfigRela);
      } catch (err) {
        this.logger.error(
          `Create post fail: ${postId}`,
          err,
          this.constructor.name,
        );
        postSiteConfigRela.state = TaskCommonState.FAIL;
        await this.postSiteConfigRepository.save(postSiteConfigRela);
        throw err;
      }
    }
    post.state = PostState.Published;
    // record title in storage for next updating
    post.titleInStorage = post.title;
    return await this.postRepository.save(post);
  }

  protected async doSavePostSiteConfigRelas(
    publishPostDto: PublishPostDto,
    postId: number,
  ) {
    const relas = publishPostDto.configIds.map(
      (configId) =>
        ({
          siteConfig: {
            id: configId,
          },
          post: {
            id: postId,
          },
          state: TaskCommonState.DOING,
        } as Partial<PostSiteConfigRelaEntity>),
    );
    this.logger.verbose(
      `Saving post site config relations postId: ${postId}`,
      this.constructor.name,
    );

    await this.postSiteConfigRepository.save(relas);
    return relas;
  }

  protected async doGeneratePostInfo(post: PostEntity) {
    const postId = post.id;
    const sourceService = this.getSourceService(post.platform);
    this.logger.verbose(
      `Fetching source content postId: ${postId}`,
      this.constructor.name,
    );

    let sourceContent: string;

    try {
      sourceContent = await sourceService.fetch(post.source);
    } catch (err) {
      await this.setPostState(post.id, PostState.Invalid);

      this.logger.error(
        `Failed to get source content of postId: ${postId}`,
        err,
        this.constructor.name,
      );
      return null;
    }
    this.logger.verbose(
      `Preprocess source content postId: ${postId}`,
      this.constructor.name,
    );

    const processedContent = await this.preprocessorService.preprocess(
      sourceContent,
    );
    const postInfo = {
      title: post.title,
      source: processedContent,
      cover: post.cover,
      summary: post.summary,
      categories: post.categories,
      tags: post.tags,
      license: post.license,
      authorDigestRequestMetadataStorageType:
        post.authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer: post.authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType:
        post.authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer:
        post.authorDigestSignatureMetadataRefer,
      serverVerificationMetadataStorageType:
        post.serverVerificationMetadataStorageType,
      serverVerificationMetadataRefer: post.serverVerificationMetadataRefer,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    } as MetaWorker.Info.Post;
    // Change title
    if (post.titleInStorage !== '' && post.titleInStorage !== post.title) {
      postInfo.title = post.titleInStorage;
      postInfo.META_SPACE_INTERNAL_NEW_TITLE = post.title;
    }
    return postInfo;
  }

  getSourceService(platform: string) {
    switch (platform) {
      case 'matataki':
        return this.matatakiSourceService;

      case 'editor':
        return this.editorSourceService;

      default:
        throw new Error('Invalid platform');
    }
  }

  signPost(
    post: PostEntity,
    content: string,
    hashAlgorithm: string,
    authorPrivateKeyString: string,
    serverPrivateKeyString: string,
  ) {
    hashAlgorithm = hashAlgorithm.toLowerCase();

    const map = new Map<string, string>();
    map.set('hashAlgorithm', hashAlgorithm);
    map.set('signAlgorithm', 'ed25519');
    map.set(
      'contentHash',
      createHash(hashAlgorithm).update(content).digest('hex'),
    );
    map.set(
      'summaryHash',
      createHash(hashAlgorithm).update(post.summary).digest('hex'),
    );
    map.set('title', post.title);
    map.set('tags', (post.tags ?? []).join(','));
    map.set('categories', (post.categories ?? []).join(','));
    map.set('cover', post.cover);

    const contentParts = [];

    for (const key of Array.from(map.keys()).sort()) {
      const value = map.get(key);

      if (contentParts.length > 0) {
        contentParts.push('&');
      }

      contentParts.push(key);
      contentParts.push('=');
      contentParts.push(encodeURIComponent(value));
    }

    const contentToSign = Buffer.from(contentParts.join());

    const ed25519PrivateKeyPkcs8Header = Buffer.from(
      '302e020100300506032b657004220420',
      'hex',
    );

    const authorPrivateKey = createPrivateKey({
      key: Buffer.concat([
        ed25519PrivateKeyPkcs8Header,
        Buffer.from(authorPrivateKeyString, 'hex'),
      ]),
      format: 'der',
      type: 'pkcs8',
    });
    const authorPublicKey = createPublicKey(authorPrivateKey);

    const serverPrivateKey = createPrivateKey({
      key: Buffer.concat([
        ed25519PrivateKeyPkcs8Header,
        Buffer.from(serverPrivateKeyString, 'hex'),
      ]),
      format: 'der',
      type: 'pkcs8',
    });
    const serverPublicKey = createPublicKey(serverPrivateKey);

    const authorSignature = sign(null, contentToSign, authorPrivateKey);
    const serverSignature = sign(null, authorSignature, serverPrivateKey);

    return {
      author: {
        publicKey: authorPublicKey
          .export({ format: 'der', type: 'spki' })
          .slice(12)
          .toString('hex'),
        signature: authorSignature.toString('hex'),
      },
      server: {
        publicKey: serverPublicKey
          .export({ format: 'der', type: 'spki' })
          .slice(12)
          .toString('hex'),
        signature: serverSignature.toString('hex'),
      },
    };
  }

  async makeDraft(postId: number) {
    const post = await this.postRepository.findOneOrFail(postId);
    const sourceService = this.getSourceService(post.platform);

    const content = await sourceService.fetch(post.source);

    const draftPost = this.postRepository.create({
      userId: post.userId,
      title: post.title,
      summary: post.summary,
      cover: post.cover,
      categories: post.categories,
      tags: post.tags,
      platform: 'editor',
      source: await this.createDraft(post.userId, content),
      state: PostState.Pending,
    });

    await this.postRepository.save(draftPost);

    return draftPost;
  }

  async getPost(postId: number) {
    const post = (await this.postRepository.findOneOrFail(postId)) as DraftPost;

    if (post.platform === 'editor') {
      const { content } = await this.draftRepository.findOneOrFail(
        Number(post.source),
      );

      post.content = content;
    }

    return post;
  }
  async createPost(
    userId: number,
    {
      content,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
      ...postDto
    }: DraftPostCreationDto,
  ) {
    const verificationKey = this.metaSignatureHelper.createPostVerificationKey(
      userId,
      postDto.title,
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
    // //TODO 写合约，记录生成 authorDigestSignWithContentServerVerificationMetadata的时间戳;
    const post = this.postRepository.create(postDto);

    post.userId = userId;
    post.platform = 'editor';
    post.source = await this.createDraft(userId, content);
    post.license = postDto.license;
    this.setPostMetadata(
      post,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
      authorDigestSignatureMetadata,

      authorDigestSignWithContentServerVerificationMetadataRefer,
    );
    post.state = PostState.Pending;

    await this.postRepository.save(post);

    return post;
  }

  setPostMetadata(
    post: PostEntity,
    authorDigestRequestMetadataStorageType: MetadataStorageType,
    authorDigestRequestMetadataRefer: string,
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
    authorDigestSignatureMetadata: AuthorSignatureMetadata,
    authorDigestSignWithContentServerVerificationMetadataRefer: string,
  ) {
    if (authorDigestRequestMetadataStorageType) {
      post.authorDigestRequestMetadataStorageType =
        authorDigestRequestMetadataStorageType;
    }
    if (authorDigestSignatureMetadataStorageType) {
      //服务端签名和作者签名的metadata用一样的storageType
      post.serverVerificationMetadataStorageType =
        post.authorDigestSignatureMetadataStorageType =
          authorDigestSignatureMetadataStorageType;
    }
    authorDigestRequestMetadataRefer &&
      (post.authorDigestRequestMetadataRefer =
        authorDigestRequestMetadataRefer);

    authorDigestSignWithContentServerVerificationMetadataRefer &&
      (post.serverVerificationMetadataRefer =
        authorDigestSignWithContentServerVerificationMetadataRefer);
    authorDigestSignatureMetadataRefer &&
      (post.authorDigestSignatureMetadataRefer =
        authorDigestSignatureMetadataRefer);
    authorDigestSignatureMetadata &&
      authorDigestSignatureMetadata.publicKey &&
      (post.authorPublicKey = authorDigestSignatureMetadata.publicKey);
  }

  async updatePost(postId: number, dto: DraftPostUpdateDto) {
    const post = (await this.postRepository.findOneOrFail(postId)) as DraftPost;

    if (post.platform !== 'editor') {
      throw new BadRequestException('post must be of editor platform');
    }

    const {
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
    } = dto;
    const verificationKey = this.metaSignatureHelper.createPostVerificationKey(
      post.userId,
      post.title,
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
    this.setPostMetadata(
      post,
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
      authorDigestSignatureMetadata,

      authorDigestSignWithContentServerVerificationMetadataRefer,
    );
    if (typeof dto.content === 'string') {
      await this.updateDraft(Number(post.source), dto.content);
    }

    this.postRepository.merge(post, dto);
    if (post.state !== PostState.Pending) {
      post.state = PostState.PendingEdit;
    }
    await this.postRepository.save(post);

    if (typeof dto.content === 'string') {
      post.content = dto.content;
    }

    return post;
  }

  // TODO: Switch to hexo storage
  async createDraft(userId: number, content: string) {
    if (typeof content !== 'string') {
      return 'local';
    }

    const draft = this.draftRepository.create({ userId, content });

    await this.draftRepository.save(draft);

    return draft.id.toString();
  }
  async updateDraft(draftId: number, content: string) {
    const draft = await this.draftRepository.findOneOrFail(draftId);

    draft.content = content;

    await this.draftRepository.save(draft);
  }
}
