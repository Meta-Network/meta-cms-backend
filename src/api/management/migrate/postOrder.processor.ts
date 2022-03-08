import {
  authorPostDigest as AuthorPostDigest,
  authorPostDigestSign as AuthorPostDigestSign,
  BaseSignatureMetadata,
  KeyPair,
  PostMetadata,
} from '@metaio/meta-signature-util-v2';
import { MetaWorker } from '@metaio/worker-model2';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import assert from 'assert';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { ConfigKeyNotFoundException } from '../../../exceptions';
import {
  GetPostsFromStorageState,
  MetadataStorageType,
  PipelineOrderTaskCommonState,
} from '../../../types/enum';
import { stringSlice } from '../../../utils';
import {
  AuthorPostDigestDto,
  AuthorPostSignDto,
  PostOrderRequestDto,
} from '../../pipelines/dto/post-order.dto';
import { PostService } from '../../post/post.service';
import { MetadataStorageService } from '../../provider/metadata-storage/metadata-storage.service';
import {
  MIGRATE_POST_ORDER_QUEUE,
  MigratePostOrderProcess,
} from './postOrder.constants';

type BaseQueueConfig = {
  configId: number;
  userId: number;
};

type PostInfoWithState = MetaWorker.Info.Post & { published: boolean };

export type FindUnrecordedPostsQueueConfig = BaseQueueConfig;

export type MigrateUnrecordedPostQueueConfig = BaseQueueConfig & {
  post: PostInfoWithState;
};

export type MigratePostOrderQueueConfig =
  | FindUnrecordedPostsQueueConfig
  | MigrateUnrecordedPostQueueConfig;

@Injectable()
@Processor(MIGRATE_POST_ORDER_QUEUE)
export class MigratePostOrderProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(PostMetadataEntity)
    private readonly postMetadatasRepository: Repository<PostMetadataEntity>,
    private readonly postService: PostService,
    private readonly metadataStorageService: MetadataStorageService,
    @InjectQueue(MIGRATE_POST_ORDER_QUEUE)
    protected readonly postOrderQueue: Queue<MigratePostOrderQueueConfig>,
  ) {
    this.serverKeys = this.configService.get<KeyPair>(
      'metaSignature.serverKeys',
    );
    this.serverDomain = this.configService.get<string>(
      'metaSignature.serverDomain',
    );
    assert(
      this.serverKeys,
      new ConfigKeyNotFoundException('metaSignature.serverKeys'),
    );
    assert(
      this.serverDomain,
      new ConfigKeyNotFoundException('metaSignature.serverDomain'),
    );
  }

  private readonly serverKeys: KeyPair;
  private readonly serverDomain: string;

  private async getUnrecordedStoragePosts(
    userId: number,
    configId: number,
    state: GetPostsFromStorageState,
  ): Promise<MetaWorker.Info.Post[]> {
    try {
      this.logger.verbose(
        `Get user ${userId} config ${configId} ${state} posts`,
        this.constructor.name,
      );
      const allPosts = await this.postService.getAllPostsFromStorage(
        userId,
        configId,
        state,
      );
      return allPosts;
    } catch (error) {
      this.logger.warn(
        `Get user ${userId} config ${configId} ${state} posts failed ${error}`,
        this.constructor.name,
      );
      return [];
    }
  }

  private async savePostOrderEntity(
    postOrderEntity: PostOrderEntity,
  ): Promise<PostOrderEntity> {
    const {
      id,
      userId,
      postMetadata: { title },
    } = postOrderEntity;
    const shortId = stringSlice(id, 18, 16);
    this.logger.verbose(
      `Save post order ${shortId} user ${userId} post '${title}'`,
      this.constructor.name,
    );
    await this.postMetadatasRepository.save(postOrderEntity.postMetadata);
    return await this.postOrdersRepository.save(postOrderEntity);
  }

  //#region For has serverVerificationMetadataRefer posts
  private async getServerVerificationMetadata(
    post: MetaWorker.Info.Post,
  ): Promise<BaseSignatureMetadata> {
    const type: MetadataStorageType =
      post?.serverVerificationMetadataStorageType as MetadataStorageType;
    const refer: string = post?.serverVerificationMetadataRefer as string;
    assert(
      refer,
      `Post ${post.title} serverVerificationMetadataRefer not found.`,
    );
    this.logger.verbose(
      `Get server verification metadata refer ${refer} from ${type} for post '${post.title}'`,
      this.constructor.name,
    );
    const signatureData = await this.metadataStorageService.get(type, refer);
    const metadata: BaseSignatureMetadata = JSON.parse(signatureData);
    return metadata;
  }

  private async createPostOrderRequestDto(
    metadata: BaseSignatureMetadata,
  ): Promise<PostOrderRequestDto> {
    const authorPostDigestRegExp = /^author(-post)?-digest$/;
    const authorPostSignRegExp = /^author-digest-sign$/;
    const findAuthorPostDigest = metadata.reference.find((s) =>
      authorPostDigestRegExp.test(s.body.type || s.body['@type']),
    );
    const findAuthorPostSign = metadata.reference.find((s) =>
      authorPostSignRegExp.test(s.body.type || s.body['@type']),
    );
    assert(
      findAuthorPostDigest,
      'Metadata reference author post digest not found.',
    );
    assert(
      findAuthorPostSign,
      'Metadata reference author post sign not found.',
    );
    const authorPostDigest: AuthorPostDigestDto = findAuthorPostDigest.body;
    const authorPostSign: AuthorPostSignDto = findAuthorPostSign.body;
    return {
      authorPostDigest,
      authorPostSign,
    };
  }
  //#endregion For has serverVerificationMetadataRefer posts

  //#region For not has serverVerificationMetadataRefer posts
  private async convertPostInfoToPostMetadata(
    post: MetaWorker.Info.Post,
  ): Promise<PostMetadata> {
    return {
      title: post?.title || '',
      categories: post?.categories?.toString() || '',
      content: post?.source || '',
      tags: post?.tags?.toString() || '',
      cover: post?.cover || '',
      license: post?.license || '',
      summary: post?.summary || '',
    };
  }

  private async generatePostOrderRequestDto(
    postMetadata: PostMetadata,
  ): Promise<PostOrderRequestDto> {
    const authorPostDigest = AuthorPostDigest.generate(postMetadata);
    const authorPostSign = AuthorPostDigestSign.generate(
      this.serverKeys,
      this.serverDomain,
      authorPostDigest.digest,
    );
    return {
      authorPostDigest,
      authorPostSign,
    };
  }
  //#endregion For not has serverVerificationMetadataRefer posts

  private async createPostOrderEntity(
    userId: number,
    postOrderRequestDto: PostOrderRequestDto,
    published?: boolean,
    serverVerificationMetadata?: BaseSignatureMetadata,
    certificateId?: string,
    certificateStorageType?: MetadataStorageType,
  ): Promise<PostOrderEntity> {
    const digest = postOrderRequestDto.authorPostDigest;
    const sign = postOrderRequestDto.authorPostSign;
    const postMetadata: Partial<PostMetadataEntity> = {
      id: sign.signature,
      ...digest,
      authorPublicKey: sign.publicKey,
    };
    this.logger.verbose(
      `Create post order entity for user ${userId} post '${digest.title}'`,
      this.constructor.name,
    );
    const entity = this.postOrdersRepository.create({
      id: sign.signature,
      userId,
      postMetadata,
      submitState: PipelineOrderTaskCommonState.FINISHED,
      publishState: published
        ? PipelineOrderTaskCommonState.FINISHED
        : PipelineOrderTaskCommonState.NONE,
      serverVerificationId:
        serverVerificationMetadata && serverVerificationMetadata.signature,
      certificateId,
      certificateStorageType,
      certificateState: certificateId && PipelineOrderTaskCommonState.FINISHED,
    });
    return entity;
  }

  private async convertPostInfoToPostOrderEntity(
    userId: number,
    post: PostInfoWithState,
  ): Promise<PostOrderEntity> {
    this.logger.verbose(
      `Convert user ${userId} post '${post.title}' to 'PostOrderEntity'`,
      this.constructor.name,
    );
    const certificateId: string =
      post?.serverVerificationMetadataRefer as string;
    const certificateStorageType: MetadataStorageType =
      post?.serverVerificationMetadataStorageType as MetadataStorageType;
    if (certificateId) {
      const metadata = await this.getServerVerificationMetadata(post);
      const dto = await this.createPostOrderRequestDto(metadata);
      return await this.createPostOrderEntity(
        userId,
        dto,
        post.published,
        metadata,
        certificateId,
        certificateStorageType,
      );
    } else {
      const metadata = await this.convertPostInfoToPostMetadata(post);
      const dto = await this.generatePostOrderRequestDto(metadata);
      return await this.createPostOrderEntity(userId, dto, post.published);
    }
  }

  @Process(MigratePostOrderProcess.findUnrecordedPosts)
  public async findUnrecordedPosts(
    job: Job<FindUnrecordedPostsQueueConfig>,
  ): Promise<void> {
    const { configId, userId } = job.data;
    const posted = await this.getUnrecordedStoragePosts(
      userId,
      configId,
      GetPostsFromStorageState.Posted,
    );
    const published = await this.getUnrecordedStoragePosts(
      userId,
      configId,
      GetPostsFromStorageState.Published,
    );
    const filtered = posted.map((post) => {
      const index = published.findIndex((pub) => pub.slug === post.slug);
      const filter: PostInfoWithState = { ...post, published: index !== -1 };
      return filter;
    });
    for (const post of filtered) {
      this.logger.verbose(
        `Add 'migrateUnrecordedPost' job for user ${userId} config ${configId} post '${post.title}'`,
        this.constructor.name,
      );
      await this.postOrderQueue.add(
        MigratePostOrderProcess.migrateUnrecordedPost,
        { configId, userId, post },
      );
    }
  }

  @Process(MigratePostOrderProcess.migrateUnrecordedPost)
  public async migrateUnrecordedPost(
    job: Job<MigrateUnrecordedPostQueueConfig>,
  ): Promise<PostOrderEntity> {
    const { configId, userId, post } = job.data;
    this.logger.verbose(
      `Process job 'migrateUnrecordedPost' for user ${userId} config ${configId} post '${post.title}'`,
      this.constructor.name,
    );
    const postOrder = await this.convertPostInfoToPostOrderEntity(userId, post);
    const save = await this.savePostOrderEntity(postOrder);
    return save;
  }
}
