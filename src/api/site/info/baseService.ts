import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { Connection, DeleteResult, FindOneOptions, Repository } from 'typeorm';

import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from '../../../entities/siteInfoWithConfigCount.entity';

@Injectable()
export class SiteInfoBaseService {
  constructor(
    @InjectRepository(SiteInfoEntity)
    private readonly siteInfoRepository: Repository<SiteInfoEntity>,
    private connection: Connection,
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
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const siteInfo = queryRunner.manager.create(SiteInfoEntity, info);
      const save = await queryRunner.manager.save(siteInfo);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    oldI: SiteInfoEntity,
    newI: SiteInfoEntity,
  ): Promise<SiteInfoEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const info = queryRunner.manager.merge(SiteInfoEntity, oldI, newI);
      const save = await this.siteInfoRepository.save(info);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async delete(sid: number): Promise<DeleteResult> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const del = await this.siteInfoRepository.delete(sid);
      await queryRunner.commitTransaction();
      return del;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }
}
