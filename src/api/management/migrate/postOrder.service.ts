import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobCounts, Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { SiteStatus } from '../../../types/enum';
import {
  MIGRATE_POST_ORDER_QUEUE,
  MigratePostOrderProcess,
} from './postOrder.constants';
import { MigratePostOrderQueueConfig } from './postOrder.processor';

export interface MgratePostOrderReturn extends JobCounts {
  new: number;
}

@Injectable()
export class MigratePostOrderService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
    @InjectQueue(MIGRATE_POST_ORDER_QUEUE)
    protected readonly postOrderQueue: Queue<MigratePostOrderQueueConfig>,
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

  public async mgratePostOrder(user: string): Promise<MgratePostOrderReturn> {
    this.logger.log(
      `Administrator ${user} start mgrate v1 post order`,
      this.constructor.name,
    );
    const recordedUserIds = await this.findRecordedUserIds();
    const unrecordedUserIds = await this.findUnrecordedUserIds(recordedUserIds);
    const publishedSiteConfigs = await this.findPublishedSiteConfigs();
    const latestSiteConfigs = await this.findLatestSiteConfigs(
      unrecordedUserIds,
      publishedSiteConfigs,
    );
    for (const config of latestSiteConfigs) {
      const configId = config.id;
      const userId = config.siteInfo.userId;
      this.logger.verbose(
        `Add 'findUnrecordedPosts' job for user ${userId} config ${configId}`,
        this.constructor.name,
      );
      await this.postOrderQueue.add(
        MigratePostOrderProcess.findUnrecordedPosts,
        { configId, userId },
      );
    }
    const jobCounts = await this.postOrderQueue.getJobCounts();
    return { ...jobCounts, new: latestSiteConfigs.length };
  }
}
