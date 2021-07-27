import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteInfo } from '../../entities/siteInfo';

@Injectable()
export class SiteInfoService {
  constructor(
    @InjectRepository(SiteInfo)
    private readonly siteInfoRepository: Repository<SiteInfo>,
  ) {}

  async getSiteInfo(uid: number): Promise<SiteInfo[]> {
    return await this.siteInfoRepository.find({ userId: uid });
  }

  async createSiteInfo(info: SiteInfo): Promise<SiteInfo> {
    const siteInfo = this.siteInfoRepository.create(info);
    return await this.siteInfoRepository.save(siteInfo);
  }

  async updateSiteInfo(sid: number, info: SiteInfo): Promise<SiteInfo> {
    const oldInfo = await this.siteInfoRepository.findOne(sid);
    const newInfo = this.siteInfoRepository.merge(oldInfo, info);
    return await this.siteInfoRepository.save(newInfo);
  }

  async deleteSiteInfo(sid: number): Promise<DeleteResult> {
    return await this.siteInfoRepository.delete(sid);
  }
}
