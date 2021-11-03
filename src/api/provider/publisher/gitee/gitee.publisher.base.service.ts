import { Injectable } from '@nestjs/common';
import { Connection, DeleteResult } from 'typeorm';

import { GiteePublisherProviderEntity } from '../../../../entities/provider/publisher/gitee.entity';

@Injectable()
export class GiteePublisherBaseService {
  constructor(private connection: Connection) {}

  public async read(
    publisherProviderId: number,
  ): Promise<GiteePublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const find = await queryRunner.manager.findOne(
      GiteePublisherProviderEntity,
      publisherProviderId,
    );
    await queryRunner.release();
    return find;
  }

  public async create(
    publisherProvider: GiteePublisherProviderEntity,
  ): Promise<GiteePublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newPublisher = queryRunner.manager.create(
        GiteePublisherProviderEntity,
        publisherProvider,
      );
      const save = await queryRunner.manager.save(newPublisher);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  public async update(
    oldPublisherProvider: GiteePublisherProviderEntity,
    newPublisherProvider: GiteePublisherProviderEntity,
  ): Promise<GiteePublisherProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const publisher = queryRunner.manager.merge(
        GiteePublisherProviderEntity,
        oldPublisherProvider,
        newPublisherProvider,
      );
      const save = await queryRunner.manager.save(publisher);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  public async delete(publisherProviderId: number): Promise<DeleteResult> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const del = await queryRunner.manager.delete(
        GiteePublisherProviderEntity,
        publisherProviderId,
      );
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
