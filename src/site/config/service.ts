import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteConfigEntity } from '../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  ResourceIsInUseException,
} from '../../exceptions';
import { checkConfigIsDeletable } from '../../utils/validation';

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
  ) {}

  async getSiteConfig(
    options: IPaginationOptions,
    uid: number,
    sid: number,
  ): Promise<Pagination<SiteConfigEntity>> {
    const info = await this.siteInfoRepository.findOne(sid);
    if (!info) throw new DataNotFoundException();
    if (info.userId !== uid) throw new AccessDeniedException();
    return await paginate<SiteConfigEntity>(
      this.siteConfigRepository,
      options,
      { where: { siteInfo: { id: sid } } },
    );
  }

  async createSiteConfig(
    uid: number,
    sid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    const info = await this.siteInfoRepository.findOne(sid);
    if (!info) throw new DataNotFoundException();
    if (info.userId !== uid) throw new AccessDeniedException();
    const newConfig: SiteConfigEntity = { ...config, siteInfo: info };
    const result = await this.siteConfigRepository.save(newConfig);
    if (result.siteInfo) delete result.siteInfo;
    return result;
  }

  async updateSiteConfig(
    uid: number,
    sid: number,
    cid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    const oldConf = await this.siteConfigRepository.findOne(
      {
        id: cid,
      },
      { relations: ['siteInfo'] },
    );
    if (!oldConf || !oldConf.siteInfo) throw new DataNotFoundException();
    if (oldConf.siteInfo.id !== sid || oldConf.siteInfo.userId !== uid)
      throw new AccessDeniedException();
    const newConf = this.siteConfigRepository.merge(oldConf, config);
    const result = await this.siteConfigRepository.save(newConf);
    if (result.siteInfo) delete result.siteInfo;
    return result;
  }

  async deleteSiteConfig(uid: number, cid: number): Promise<DeleteResult> {
    const config = await this.siteConfigRepository.findOne(
      {
        id: cid,
      },
      { relations: ['siteInfo'] },
    );
    if (!config || !config.siteInfo) throw new DataNotFoundException();
    if (config.siteInfo.userId !== uid) throw new AccessDeniedException();
    if (!checkConfigIsDeletable(config)) throw new ResourceIsInUseException();
    return await this.siteConfigRepository.delete(cid);
  }
}
