import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { SiteStatus } from '../../../types/enum';

@Injectable()
export class MigratePostOrderService {
  constructor(
    @InjectRepository(PostOrderEntity)
    private readonly postOrdersRepository: Repository<PostOrderEntity>,
    @InjectRepository(PostMetadataEntity)
    private readonly postMetadatasRepository: Repository<PostMetadataEntity>,
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
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

  private async findUnrecordedUserIds(): Promise<number[]> {
    const recordedUserIds = await this.findRecordedUserIds();
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

  private async findLatestSiteConfigs(): Promise<SiteConfigEntity[]> {
    const unrecordedUserIds = await this.findUnrecordedUserIds();
    const publishedSiteConfigs = await this.findPublishedSiteConfigs();
    const finded = unrecordedUserIds.map((userId) =>
      publishedSiteConfigs.find((config) => config.siteInfo.userId === userId),
    );
    const filtered = finded.filter(
      (config) => typeof config !== 'undefined' && config !== null,
    );
    return filtered;
  }

  public async mgratePostOrder(): Promise<SiteConfigEntity[]> {
    const latestSiteConfigs = await this.findLatestSiteConfigs();
    return latestSiteConfigs;
  }
}
