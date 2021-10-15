import { MetaWorker } from '@metaio/worker-model';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createPrivateKey, createPublicKey, sign } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';

import { DraftEntity } from '../../entities/draft.entity';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { PostState } from '../../enums/postState';
import {
  AccessDeniedException,
  InvalidStatusException,
} from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { TaskCommonState } from '../../types/enum';
import { SiteConfigLogicService } from '../site/config/logicService';
import { TasksService } from '../task/tasks.service';
import { PublishPostDto, PublishPostsDto } from './dto/publish-post.dto';
import { PreProcessorService } from './preprocessor/preprocessor.service';
import { EditorSourceService } from './sources/editor/editor-source.service';
import { MatatakiSourceService } from './sources/matataki/matataki-source.service';

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

  async publishPendingPost(
    user: Partial<UCenterJWTPayload>,
    postId: number,
    publishPostDto: PublishPostDto,
  ) {
    this.logger.verbose(
      `Find the post to publish postId: ${postId}`,
      this.constructor.name,
    );

    const post = await this.postRepository.findOneOrFail(postId);
    if (post.userId !== user.id) {
      throw new AccessDeniedException('access denied, user id inconsistent');
    }

    if (post.state !== PostState.Pending) {
      throw new InvalidStatusException('invalid post state');
    }

    await this.siteConfigLogicService.validateSiteConfigsUserId(
      publishPostDto.configIds,
      user.id,
    );
    // check site config & skip check in `doFetchContentAndCreatePost` method
    for (const siteconfigId of publishPostDto.configIds) {
      await this.tasksService.checkSiteConfigTaskWorkspace(siteconfigId);
    }
    return await this.doPublishPost(user, post, publishPostDto);
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
    // check site config & skip check in `doFetchContentAndCreatePost` method
    for (const siteconfigId of publishPostsDto.configIds) {
      await this.tasksService.checkSiteConfigTaskWorkspace(siteconfigId);
    }
    const posts = await this.postRepository.findByIds(postIds);
    const postInfos = [] as MetaWorker.Info.Post[];
    for (const post of posts) {
      if (post.userId !== user.id) {
        throw new AccessDeniedException('access denied, user id inconsistent');
      }

      if (post.state !== PostState.Pending) {
        throw new InvalidStatusException('invalid post state');
      }
      postInfos.push(await this.doGeneratePostInfo(post));
      await this.doSavePostSiteConfigRelas(publishPostsDto, post.id);
    }
    for (const siteConfigId of publishPostsDto.configIds) {
      try {
        await this.tasksService.createPosts(user, postInfos, siteConfigId);
        await this.updatePostSiteRelaStateBySiteConfigId(
          TaskCommonState.SUCCESS,
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
          siteConfigId,
        );
        throw err;
      }
    }
    return posts;
  }
  async updatePostSiteRelaStateBySiteConfigId(
    state: TaskCommonState,
    siteConfigId: number,
  ) {
    await this.postSiteConfigRepository.update(
      {
        siteConfig: {
          id: siteConfigId,
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
  ) {
    const postId = post.id;

    const postInfo = await this.doGeneratePostInfo(post);
    const relas = await this.doSavePostSiteConfigRelas(publishPostDto, postId);
    for (const postSiteConfigRela of relas) {
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
          true,
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

    const sourceContent = await sourceService.fetch(post.source);
    this.logger.verbose(
      `Preprocess source content postId: ${postId}`,
      this.constructor.name,
    );

    const processedContent = await this.preprocessorService.preprocess(
      sourceContent,
    );
    return {
      title: post.title,
      source: processedContent,
      cover: post.cover,
      summary: post.summary,
      categories: post.categories,
      tags: post.tags,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    } as MetaWorker.Info.Post;
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
    const draft = this.draftRepository.create({ userId: post.userId, content });

    await this.draftRepository.save(draft);

    const draftPost = this.postRepository.create({
      userId: post.userId,
      title: post.title,
      summary: post.summary,
      cover: post.cover,
      categories: post.categories,
      tags: post.tags,
      platform: 'editor',
      source: draft.id.toString(),
      state: PostState.Drafted,
    });

    await this.postRepository.save(draftPost);

    return draftPost;
  }

  async getPost(postId: number) {
    const post = await this.postRepository.findOneOrFail(postId);

    if (post.platform === 'editor') {
      const { content } = await this.draftRepository.findOneOrFail(
        Number(post.source),
      );

      Object.assign(post, { content });
    }

    return post;
  }
  async updatePost(postId: number, content: string) {
    const post = await this.postRepository.findOneOrFail(postId);

    if (post.platform !== 'editor') {
      throw new BadRequestException('post must be of editor platform');
    }

    await this.draftRepository.update(Number(post.source), { content });
  }
}
