import { Injectable } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { SiteConfigBaseService } from 'src/api/site/config/baseService';
import { SiteInfoLogicService } from 'src/api/site/info/logicService';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  RelationNotFoundException,
  ResourceIsInUseException,
  validationErrorToBadRequestException,
} from 'src/exceptions';
import { checkConfigIsDeletable } from 'src/utils/validation';
import { DeleteResult, FindOneOptions } from 'typeorm';

@Injectable()
export class SiteConfigLogicService {
  constructor(
    private readonly siteConfigBaseService: SiteConfigBaseService,
    private readonly siteInfoLogicService: SiteInfoLogicService,
  ) {}

  async getSiteConfig(
    uid: number,
    sid: number,
    page: number,
    limit: number,
  ): Promise<Pagination<SiteConfigEntity>> {
    await this.siteInfoLogicService.validateSiteInfoUserId(sid, uid);

    limit = limit > 100 ? 100 : limit;
    const options: IPaginationOptions = {
      page,
      limit,
      route: '/site/config',
    };

    return await this.siteConfigBaseService.read(options, sid);
  }

  async createSiteConfig(
    uid: number,
    sid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    try {
      const info = await this.siteInfoLogicService.validateSiteInfoUserId(
        sid,
        uid,
      );

      const tmpConfig = Object.assign(new SiteConfigEntity(), config);
      await validateOrReject(tmpConfig);

      const newConfig: SiteConfigEntity = { ...tmpConfig, siteInfo: info };
      const result = await this.siteConfigBaseService.create(newConfig);

      if (result.siteInfo) delete result.siteInfo;
      return result;
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  async updateSiteConfig(
    uid: number,
    sid: number,
    cid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    try {
      const oldConf = await this.validateSiteConfigUserId(cid, uid);
      if (oldConf.siteInfo.id !== sid)
        throw new AccessDeniedException('access denied, site id inconsistent');

      const tmpConf = Object.assign(new SiteConfigEntity(), config);
      await validateOrReject(tmpConf, { skipMissingProperties: true });

      const result = await this.siteConfigBaseService.update(oldConf, tmpConf);

      if (result.siteInfo) delete result.siteInfo;
      return result;
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  async deleteSiteConfig(uid: number, cid: number): Promise<DeleteResult> {
    const config = await this.validateSiteConfigUserId(cid, uid);
    if (!checkConfigIsDeletable(config)) throw new ResourceIsInUseException();

    return await this.siteConfigBaseService.delete(cid);
  }

  async validateSiteConfigUserId(
    cid: number,
    uid: number,
    options: FindOneOptions<SiteConfigEntity> = { relations: ['siteInfo'] },
  ): Promise<SiteConfigEntity> {
    const config = await this.siteConfigBaseService.readOne(cid, options);
    if (!config) throw new DataNotFoundException('site config not found');
    if (!config.siteInfo) throw new RelationNotFoundException();
    if (config.siteInfo.userId !== uid)
      throw new AccessDeniedException('access denied, user id inconsistent');
    return config;
  }
}
