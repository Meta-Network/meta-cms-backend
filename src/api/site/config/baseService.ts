import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  MoreThan,
  Repository,
} from 'typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteStatus } from '../../../types/enum';
import {
  isFindManyOptions,
  isPaginationOptions,
} from '../../../utils/typeGuard';

@Injectable()
export class SiteConfigBaseService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
  ) {}

  async read(
    options: FindManyOptions<SiteConfigEntity>,
  ): Promise<SiteConfigEntity[]>;
  async read(
    options: IPaginationOptions,
    sid: number,
  ): Promise<Pagination<SiteConfigEntity>>;
  async read(
    arg1: FindManyOptions<SiteConfigEntity> | IPaginationOptions,
    arg2?: number,
  ): Promise<SiteConfigEntity[] | Pagination<SiteConfigEntity>> {
    if (isPaginationOptions(arg1) && typeof arg2 === 'number') {
      return await paginate<SiteConfigEntity>(this.siteConfigRepository, arg1, {
        where: { siteInfo: { id: arg2 } },
      });
    }
    if (isFindManyOptions<SiteConfigEntity>(arg1)) {
      return await this.siteConfigRepository.find(arg1);
    }
  }

  async readByModifedAfter(modifiedAfter: Date): Promise<SiteConfigEntity[]> {
    return await this.siteConfigRepository.find({
      where: {
        updatedAt: MoreThan(modifiedAfter),
        status: SiteStatus.Published,
      },
      relations: ['siteInfo'],
    });
  }

  async readOne(
    options?: FindOneOptions<SiteConfigEntity>,
  ): Promise<SiteConfigEntity>;
  async readOne(
    cid: number,
    options?: FindOneOptions<SiteConfigEntity>,
  ): Promise<SiteConfigEntity>;
  async readOne(
    arg1: number | FindOneOptions<SiteConfigEntity>,
    arg2?: FindOneOptions<SiteConfigEntity>,
  ): Promise<SiteConfigEntity> {
    if (typeof arg1 === 'number') {
      return await this.siteConfigRepository.findOne(arg1, arg2);
    }
    return await this.siteConfigRepository.findOne(arg1);
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
