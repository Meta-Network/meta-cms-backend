import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';

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
      userId: uid,
    });
  }

  async createSiteInfo(info: SiteInfoEntity): Promise<SiteInfoEntity> {
    const siteInfo = this.siteInfoRepository.create(info);
    return await this.siteInfoRepository.save(siteInfo);
  }

  async updateSiteInfo(
    sid: number,
    info: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    const oldInfo = await this.siteInfoRepository.findOne(sid);
    const newInfo = this.siteInfoRepository.merge(oldInfo, info);
    return await this.siteInfoRepository.save(newInfo);
  }

  async deleteSiteInfo(sid: number): Promise<DeleteResult> {
    return await this.siteInfoRepository.delete(sid);
  }
}
