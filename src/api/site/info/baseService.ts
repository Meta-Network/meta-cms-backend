import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { DeleteResult, FindOneOptions, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SiteInfoEntity } from 'src/entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from 'src/entities/siteInfoWithConfigCount.entity';

@Injectable()
export class SiteInfoBaseService {
  constructor(
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
  ) {}

  async read(
    options: IPaginationOptions,
    uid: number,
  ): Promise<Pagination<SiteInfoEntity>> {
    return await paginate<SiteInfoEntity>(this.siteInfoRepository, options, {
      where: {
        userId: uid,
      },
    });
  }

  async readOne(
    sid: number,
    options: FindOneOptions<SiteInfoEntity>,
  ): Promise<SiteInfoEntity> {
    return await this.siteInfoRepository.findOne(sid, options);
  }

  async readAndCountConfig(
    options: IPaginationOptions,
    uid: number,
  ): Promise<Pagination<SiteInfoWithConfigCountEntity>> {
    const queryBuilder = this.siteInfoRepository.createQueryBuilder('siteInfo');
    queryBuilder
      .where('siteInfo.userId = :uid', { uid })
      .loadRelationCountAndMap('siteInfo.configCount', 'siteInfo.configs');
    return (await paginate<SiteInfoEntity>(
      queryBuilder,
      options,
    )) as Pagination<SiteInfoWithConfigCountEntity>;
  }

  async create(info: SiteInfoEntity): Promise<SiteInfoEntity> {
    const siteInfo = this.siteInfoRepository.create(info);
    return await this.siteInfoRepository.save(siteInfo);
  }

  async update(
    oldI: SiteInfoEntity,
    newI: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    const info = this.siteInfoRepository.merge(oldI, newI);
    return await this.siteInfoRepository.save(info);
  }

  async delete(sid: number): Promise<DeleteResult> {
    return await this.siteInfoRepository.delete(sid);
  }
}
