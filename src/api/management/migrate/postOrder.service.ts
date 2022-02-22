import { MetaWorker } from '@metaio/worker-model2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { GetPostsFromStorageState, SiteStatus } from '../../../types/enum';
import { PostService } from '../../post/post.service';

type UnrecoredStoragePosts = {
  configId: number;
  userId: number;
  posts: MetaWorker.Info.Post[];
};

type UnrecoredPosts = {
  configId: number;
  userId: number;
  posted: MetaWorker.Info.Post[];
  published: MetaWorker.Info.Post[];
};

@Injectable()
export class MigratePostOrderService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(PostMetadataEntity)
    private readonly postMetadatasRepository: Repository<PostMetadataEntity>,
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
    private readonly postService: PostService,
  ) {}

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

  private async getUnrecoredStoragePosts(
    latestSiteConfigs: SiteConfigEntity[],
    state: GetPostsFromStorageState,
  ): Promise<UnrecoredStoragePosts[]> {
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

  public async mgratePostOrder(): Promise<UnrecoredPosts[]> {
    const recordedUserIds = await this.findRecordedUserIds();
    const unrecordedUserIds = await this.findUnrecordedUserIds(recordedUserIds);
    const publishedSiteConfigs = await this.findPublishedSiteConfigs();
    const latestSiteConfigs = await this.findLatestSiteConfigs(
      unrecordedUserIds,
      publishedSiteConfigs,
    );
    const unrecoredPostedPosts = await this.getUnrecoredStoragePosts(
      latestSiteConfigs,
      GetPostsFromStorageState.Posted,
    );
    const unrecoredPublishedPosts = await this.getUnrecoredStoragePosts(
      latestSiteConfigs,
      GetPostsFromStorageState.Published,
    );

    const unrecoredPosts: UnrecoredPosts[] = unrecoredPostedPosts.map(
      (posted) => {
        const published = unrecoredPublishedPosts.find(
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

    return unrecoredPosts;
  }
}
