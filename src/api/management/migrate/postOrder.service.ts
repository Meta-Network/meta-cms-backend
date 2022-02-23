import {
  authorPostDigest as AuthorPostDigest,
  authorPostDigestSign as AuthorPostDigestSign,
  BaseSignatureMetadata,
  KeyPair,
  PostMetadata,
} from '@metaio/meta-signature-util-v2';
import { MetaWorker } from '@metaio/worker-model2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import assert from 'assert';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { Convert } from '../../../types';
import {
  GetPostsFromStorageState,
  MetadataStorageType,
  PipelineOrderTaskCommonState,
  SiteStatus,
} from '../../../types/enum';
import {
  AuthorPostDigestDto,
  AuthorPostSignDto,
  PostOrderRequestDto,
} from '../../pipelines/dto/post-order.dto';
import { PostService } from '../../post/post.service';
import { MetadataStorageService } from '../../provider/metadata-storage/metadata-storage.service';

type UnrecordedStoragePosts = {
  configId: number;
  userId: number;
  posts: MetaWorker.Info.Post[];
};

type UnrecordedPosts = {
  configId: number;
  userId: number;
  posted: MetaWorker.Info.Post[];
  published: MetaWorker.Info.Post[];
};

type PostInfoWithState = MetaWorker.Info.Post & { published: boolean };

type FilteredUnrecordedPosts = Convert<
  Omit<UnrecordedPosts, 'published'>,
  'posted',
  PostInfoWithState[]
>;

type UnrecordedPostOrderEntities = Convert<
  FilteredUnrecordedPosts,
  'posted',
  PostOrderEntity[]
>;

@Injectable()
export class MigratePostOrderService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(PostMetadataEntity)
    private readonly postMetadatasRepository: Repository<PostMetadataEntity>,
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
    private readonly postService: PostService,
    private readonly metadataStorageService: MetadataStorageService,
  ) {
    this.serverKeys = this.configService.get<KeyPair>(
      'metaSignature.serverKeys',
    );
    this.serverDomain = this.configService.get<string>(
      'metaSignature.serverDomain',
    );
    assert(this.serverKeys, 'Config key metaSignature.serverKeys not found.');
    assert(
      this.serverDomain,
      'Config key metaSignature.serverDomain not found.',
    );
  }

  private readonly serverKeys: KeyPair;
  private readonly serverDomain: string;

  private async savePostOrderEntity(
    postOrderEntity: PostOrderEntity,
  ): Promise<PostOrderEntity> {
    await this.postMetadatasRepository.save(postOrderEntity.postMetadata);
    return await this.postOrdersRepository.save(postOrderEntity);
  }

  private async updatePostOrderEntity(
    postOrderId: string,
    partialEntity: Partial<PostOrderEntity>,
  ): Promise<void> {
    await this.postOrdersRepository.update(postOrderId, partialEntity);
  }

  private async findRecordedUserIds(): Promise<number[]> {
    const postOrderQB =
      this.postOrdersRepository.createQueryBuilder('postOrder');
    const postOrders = await postOrderQB
      .select('postOrder.userId')
      .distinct()
      .getRawMany<{ postOrder_userId: number }>();
    const postOrderUserIds = postOrders.map((order) => order.postOrder_userId);
    return postOrderUserIds;
  }

  private async findUnrecordedUserIds(
    recordedUserIds: number[],
  ): Promise<number[]> {
    const siteInfoQB = this.siteInfoRepository.createQueryBuilder('siteInfo');
    const siteInfos = await siteInfoQB
      .select('siteInfo.userId')
      .distinct(true)
      .where('siteInfo.userId NOT IN (:...ids)', { ids: recordedUserIds })
      .orderBy('siteInfo.userId', 'ASC')
      .getRawMany<{ siteInfo_userId: number }>();
    const siteInfoUserIds = siteInfos.map((info) => info.siteInfo_userId);
    return siteInfoUserIds;
  }

  private async findPublishedSiteConfigs(): Promise<SiteConfigEntity[]> {
    const siteConfigQB =
      this.siteConfigRepository.createQueryBuilder('siteConfig');
    const siteConfigs = await siteConfigQB
      .leftJoinAndSelect('siteConfig.siteInfo', 'siteInfo')
      .where('siteConfig.status LIKE :s', { s: SiteStatus.Published })
      .orderBy('siteConfig.lastPublishedAt', 'DESC')
      .getMany();
    return siteConfigs;
  }

  private async findLatestSiteConfigs(
    unrecordedUserIds: number[],
    publishedSiteConfigs: SiteConfigEntity[],
  ): Promise<SiteConfigEntity[]> {
    const finded = unrecordedUserIds.map((userId) =>
      publishedSiteConfigs.find((config) => config.siteInfo.userId === userId),
    );
    const filtered = finded.filter(
      (config) => typeof config !== 'undefined' && config !== null,
    );
    return filtered;
  }

  private async getUnrecordedStoragePosts(
    latestSiteConfigs: SiteConfigEntity[],
    state: GetPostsFromStorageState,
  ): Promise<UnrecordedStoragePosts[]> {
    const promises = latestSiteConfigs.map(
      async (config) =>
        await this.postService.getAllPostsFromStorage(
          config.siteInfo.userId,
          config.id,
          state,
        ),
    );
    const promiseResult = await Promise.allSettled(promises);
    const result = promiseResult.map((res, index) => {
      const config = latestSiteConfigs[index];
      const configId = config.id;
      const userId = config.siteInfo.userId;
      if (res.status === 'rejected') {
        this.logger.warn(
          `Get user ${userId} config ${configId} ${state} posts failed ${res.reason}`,
          this.constructor.name,
        );
      }
      return {
        configId,
        userId,
        posts: res.status === 'fulfilled' ? res.value : [],
      };
    });
    return result;
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
    const signatureData = await this.metadataStorageService.get(type, refer);
    const metadata: BaseSignatureMetadata = JSON.parse(signatureData);
    return metadata;
  }

  private async createPostOrderRequestDto(
    metadata: BaseSignatureMetadata,
  ): Promise<PostOrderRequestDto> {
    const findAuthorPostDigest = metadata.reference.find(
      (s) => s.body.type === 'author-digest',
    );
    const findAuthorPostSign = metadata.reference.find(
      (s) => s.body.type === 'author-digest-sign',
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
    const entity = this.postOrdersRepository.create({
      id: sign.signature,
      userId,
      postMetadata,
      submitState: PipelineOrderTaskCommonState.FINISHED,
      publishState: published && PipelineOrderTaskCommonState.FINISHED,
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

  public async mgratePostOrder(): Promise<UnrecordedPostOrderEntities[]> {
    const recordedUserIds = await this.findRecordedUserIds();
    const unrecordedUserIds = await this.findUnrecordedUserIds(recordedUserIds);
    const publishedSiteConfigs = await this.findPublishedSiteConfigs();
    const latestSiteConfigs = await this.findLatestSiteConfigs(
      unrecordedUserIds,
      publishedSiteConfigs,
    );
    const unrecordedPostedPosts = await this.getUnrecordedStoragePosts(
      latestSiteConfigs,
      GetPostsFromStorageState.Posted,
    );
    const unrecordedPublishedPosts = await this.getUnrecordedStoragePosts(
      latestSiteConfigs,
      GetPostsFromStorageState.Published,
    );
    const unrecordedPosts: UnrecordedPosts[] = unrecordedPostedPosts.map(
      (posted) => {
        const published = unrecordedPublishedPosts.find(
          (published) => published.configId === posted.configId,
        );
        return {
          configId: posted.configId,
          userId: posted.userId,
          posted: posted.posts,
          published: published.posts,
        };
      },
    );
    const filteredUnrecordedPosts: FilteredUnrecordedPosts[] =
      unrecordedPosts.map((posts) => {
        const filteredPosts = posts.posted.map((post) => {
          const index = posts.published.findIndex(
            (pub) => pub.slug === post.slug,
          );
          const filter: PostInfoWithState = {
            ...post,
            published: index !== -1,
          };
          return filter;
        });
        return {
          configId: posts.configId,
          userId: posts.userId,
          posted: filteredPosts,
        };
      });
    const entitiesPromise = filteredUnrecordedPosts.map(async (posts) => {
      const convertPromises = posts.posted.map(
        async (post) =>
          await this.convertPostInfoToPostOrderEntity(
            Number(post.userId),
            post,
          ),
      );
      // TODO: use Promise.allSettled
      const converted = await Promise.all(convertPromises);
      const entities: UnrecordedPostOrderEntities = {
        configId: posts.configId,
        userId: posts.userId,
        posted: converted,
      };
      return entities;
    });
    const unrecordedPostOrderEntities: UnrecordedPostOrderEntities[] =
      await Promise.all(entitiesPromise);

    return unrecordedPostOrderEntities;
  }
}
