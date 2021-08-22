import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, FindOneOptions, Repository } from 'typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';

@Injectable()
export class SiteConfigBaseService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
  ) {}

  async read(
    options: IPaginationOptions,
    sid: number,
  ): Promise<Pagination<SiteConfigEntity>> {
    return await paginate<SiteConfigEntity>(
      this.siteConfigRepository,
      options,
      { where: { siteInfo: { id: sid } } },
    );
  }

  async readOne(
    cid: number,
    options: FindOneOptions<SiteConfigEntity>,
  ): Promise<SiteConfigEntity> {
    return await this.siteConfigRepository.findOne(cid, options);
  }

  async create(config: SiteConfigEntity): Promise<SiteConfigEntity> {
    const siteConfig = this.siteConfigRepository.create(config);
    return await this.siteConfigRepository.save(siteConfig);
  }

  async update(
    oldC: SiteConfigEntity,
    newC: SiteConfigEntity,
  ): Promise<SiteConfigEntity> {
    const config = this.siteConfigRepository.merge(oldC, newC);
    return await this.siteConfigRepository.save(config);
  }

  async delete(cid: number): Promise<DeleteResult> {
    return await this.siteConfigRepository.delete(cid);
  }
}
