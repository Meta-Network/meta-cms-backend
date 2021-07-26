import { Repository } from 'typeorm';
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
}
