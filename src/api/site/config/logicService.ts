import { MetaInternalResult, ServiceCode } from '@metaio/microservice-model';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DeleteResult, Equal, FindOneOptions, In, IsNull, Not } from 'typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  RelationNotFoundException,
  ResourceIsInUseException,
} from '../../../exceptions';
import { SiteStatus } from '../../../types/enum';
import { checkConfigIsDeletable } from '../../../utils/validation';
import { SiteConfigBaseService } from '../../site/config/baseService';
import { SiteInfoLogicService } from '../../site/info/logicService';

export type FetchSiteInfosReturn = {
  configId: number;
  userId: number;
  title: string;
  subtitle: string;
  description: string;
  domain: string;
  metaSpacePrefix: string;
};

@Injectable()
export class SiteConfigLogicService {
  constructor(
    private readonly siteConfigBaseService: SiteConfigBaseService,
    private readonly siteInfoLogicService: SiteInfoLogicService,
    private readonly config: ConfigService,
  ) {
    const metaSpaceBase = this.config.get<string>('metaSpace.baseDomain');
    if (!metaSpaceBase) {
      throw new Error('Config key metaSpace.baseDomain: no value');
    }
    this.metaSpaceBase = metaSpaceBase;
  }

  private readonly metaSpaceBase: string;

  // If no domain use `metaSpacePrefix.metaSpaceBase`, for frontend display
  private generateMetaSpaceDomain(config: SiteConfigEntity): SiteConfigEntity {
    if (!config?.domain) {
      return {
        ...config,
        domain: `${config.metaSpacePrefix}.${this.metaSpaceBase}`,
      };
    } else {
      return config;
    }
  }

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
    const configs = await this.siteConfigBaseService.read(options, sid);
    if (Array.isArray(configs.items) && configs.items.length) {
      const items = configs.items.map((item) =>
        this.generateMetaSpaceDomain(item),
      );
      return { ...configs, items };
    } else {
      return configs;
    }
  }

  async createSiteConfig(
    uid: number,
    sid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    const info = await this.siteInfoLogicService.validateSiteInfoUserId(
      sid,
      uid,
    );

    const tmpConfig = Object.assign(new SiteConfigEntity(), config);

    const newConfig: SiteConfigEntity = { ...tmpConfig, siteInfo: info };
    const result = await this.siteConfigBaseService.create(newConfig);

    if (result.siteInfo) delete result.siteInfo;
    return result;
  }

  async updateSiteConfig(
    uid: number,
    // sid: number,
    cid: number,
    config: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    const oldConf = await this.validateSiteConfigUserId(cid, uid);
    // if (oldConf.siteInfo.id !== sid)
    //   throw new AccessDeniedException('access denied, site id inconsistent');

    const result = await this.siteConfigBaseService.update(oldConf, config);

    if (result.siteInfo) delete result.siteInfo;
    return result;
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

  async validateSiteConfigsUserId(
    configIds: number[],
    uid: number,
    options: FindOneOptions<SiteConfigEntity> = { relations: ['siteInfo'] },
  ): Promise<SiteConfigEntity[]> {
    const configs = await this.siteConfigBaseService.read({
      ...options,
      where: { id: In(configIds) },
    });
    if (!configs || configs.length == 0) {
      throw new DataNotFoundException('site configs not found');
    }
    for (const config of configs) {
      if (!config.siteInfo) throw new RelationNotFoundException();
      if (config.siteInfo.userId !== uid)
        throw new AccessDeniedException('access denied, user id inconsistent');
    }
    return configs;
  }

  /**
   * For internal use only
   */
  async getSiteConfigById(cid: number): Promise<SiteConfigEntity> {
    const config = await this.siteConfigBaseService.readOne(cid, {
      relations: ['siteInfo'],
    });
    return config;
  }

  async setPublished(siteConfigId: number): Promise<SiteConfigEntity> {
    const config = await this.siteConfigBaseService.readOne(siteConfigId);
    const update = await this.siteConfigBaseService.update(config, {
      ...config,
      status: SiteStatus.Published,
      lastPublishedAt: new Date(),
    });
    return update;
  }

  /** For internal use only */
  async updateSiteConfigStatus(
    cid: number,
    status: SiteStatus,
  ): Promise<SiteConfigEntity> {
    const config = await this.siteConfigBaseService.readOne(cid);
    const update = await this.siteConfigBaseService.update(config, {
      ...config,
      status,
    });
    return update;
  }

  async fetchSiteInfos(queries: {
    modifiedAfter: Date;
  }): Promise<MetaInternalResult<FetchSiteInfosReturn[]>> {
    const siteConfigs = await this.siteConfigBaseService.readByModifedAfter(
      queries.modifiedAfter,
    );
    const result = new MetaInternalResult<FetchSiteInfosReturn[]>({
      serviceCode: ServiceCode.CMS,
    });

    result.data = siteConfigs.map((config) => ({
      configId: config.id,
      userId: config.siteInfo.userId,
      title: config.siteInfo.title,
      subtitle: config.siteInfo.subtitle,
      description: config.siteInfo.description,
      domain: config.domain,
      metaSpacePrefix: config.metaSpacePrefix,
    }));

    return result;
  }

  async findRandomSiteConfig(): Promise<SiteConfigEntity> {
    const conf = await this.siteConfigBaseService.read({
      where: {
        metaSpacePrefix: Not(IsNull()),
        status: Equal(SiteStatus.Published),
      },
      relations: ['siteInfo'],
    });
    const rand = conf[(Math.random() * conf.length) >> 0];
    return this.generateMetaSpaceDomain(rand);
  }

  async getUserDefaultSiteConfig(userId: number): Promise<SiteConfigEntity> {
    const config = await this.siteConfigBaseService.readOne({
      where: {
        siteInfo: {
          userId,
        },
      },
      order: {
        id: 'DESC',
      },
      relations: ['siteInfo'],
    });
    return this.generateMetaSpaceDomain(config);
  }
}
