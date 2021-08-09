import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteConfigEntity } from '../../entities/siteConfig.entity';

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

  async create(config: SiteConfigEntity): Promise<SiteConfigEntity> {
    const siteConfig = this.siteConfigRepository.create(config);
    return await this.siteConfigRepository.save(siteConfig);
  }

  async update(config: SiteConfigEntity): Promise<SiteConfigEntity> {
    return await this.siteConfigRepository.save(config);
  }

  async delete(cid: number): Promise<DeleteResult> {
    return await this.siteConfigRepository.delete(cid);
  }
}
