import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from '../../entities/siteInfoWithConfigCount.entity';
import { AccessDeniedException, DataNotFoundException } from '../../exceptions';

@Injectable()
export class SiteInfoService {
  constructor(
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
  ) {}

  async getSiteInfo(
    options: IPaginationOptions,
    uid: number,
  ): Promise<Pagination<SiteInfoEntity>> {
    return await paginate<SiteInfoEntity>(this.siteInfoRepository, options, {
      where: {
        userId: uid,
      },
    });
  }

  async getSiteInfoAndCountConfig(
    options: IPaginationOptions,
    uid: number,
  ): Promise<Pagination<SiteInfoWithConfigCountEntity>> {
    const queryBuilder = this.siteInfoRepository.createQueryBuilder('siteInfo');
    queryBuilder
      .where('siteInfo.userId = :uid', { uid })
      .loadRelationCountAndMap('siteInfo.configCount', 'siteInfo.configs');
    return (await paginate<SiteInfoEntity>(
      queryBuilder,
      options,
    )) as Pagination<SiteInfoWithConfigCountEntity>;
  }

  async createSiteInfo(info: SiteInfoEntity): Promise<SiteInfoEntity> {
    const siteInfo = this.siteInfoRepository.create(info);
    return await this.siteInfoRepository.save(siteInfo);
  }

  async updateSiteInfo(
    uid: number,
    sid: number,
    info: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    const oldInfo = await this.siteInfoRepository.findOne(sid);
    if (!oldInfo || !oldInfo.userId) throw new DataNotFoundException();
    if (oldInfo.userId !== uid) throw new AccessDeniedException();
    const newInfo = this.siteInfoRepository.merge(oldInfo, info);
    return await this.siteInfoRepository.save(newInfo);
  }

  async deleteSiteInfo(uid: number, sid: number): Promise<DeleteResult> {
    const oldInfo = await this.siteInfoRepository.findOne(sid);
    if (!oldInfo || !oldInfo.userId) throw new DataNotFoundException();
    if (oldInfo.userId !== uid) throw new AccessDeniedException();
    return await this.siteInfoRepository.delete(sid);
  }
}
