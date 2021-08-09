import { validateOrReject } from 'class-validator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from '../../entities/siteInfoWithConfigCount.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  validationErrorToBadRequestException,
} from '../../exceptions';
import { SiteInfoBaseService } from './baseService';

@Injectable()
export class SiteInfoLogicService {
  constructor(
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    private readonly siteInfoBaseService: SiteInfoBaseService,
  ) {}

  async getSiteInfo(
    uid: number,
    countConfig: boolean,
    page: number,
    limit: number,
  ): Promise<
    Pagination<SiteInfoEntity> | Pagination<SiteInfoWithConfigCountEntity>
  > {
    limit = limit > 100 ? 100 : limit;
    const option: IPaginationOptions = {
      page,
      limit,
      route: '/site/info',
    };

    if (countConfig) {
      return await this.siteInfoBaseService.readAndCountConfig(option, uid);
    }

    return await this.siteInfoBaseService.read(option, uid);
  }

  async createSiteInfo(
    uid: number,
    info: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    try {
      const newInfo = Object.assign(new SiteInfoEntity(), {
        ...info,
        userId: uid,
      });
      await validateOrReject(newInfo);

      return await this.siteInfoBaseService.create(newInfo);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  async updateSiteInfo(
    uid: number,
    sid: number,
    info: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    try {
      const oldInfo = await this.siteInfoRepository.findOne(sid);
      if (!oldInfo || !oldInfo.userId) throw new DataNotFoundException();
      if (oldInfo.userId !== uid) throw new AccessDeniedException();

      const tmpInfo = Object.assign(new SiteInfoEntity(), info);
      await validateOrReject(tmpInfo, { skipMissingProperties: true });

      const newInfo = this.siteInfoRepository.merge(oldInfo, tmpInfo);
      return await this.siteInfoBaseService.update(newInfo);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  async deleteSiteInfo(uid: number, sid: number): Promise<DeleteResult> {
    const oldInfo = await this.siteInfoRepository.findOne(sid);
    if (!oldInfo || !oldInfo.userId) throw new DataNotFoundException();
    if (oldInfo.userId !== uid) throw new AccessDeniedException();

    return await this.siteInfoBaseService.delete(sid);
  }
}
