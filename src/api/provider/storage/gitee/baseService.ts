import { Injectable } from '@nestjs/common';
import { Connection, DeleteResult } from 'typeorm';

import { GiteeStorageProviderEntity } from '../../../../entities/provider/storage/gitee.entity';

@Injectable()
export class GiteeStorageBaseService {
  constructor(private connection: Connection) {}

  async read(sid: number): Promise<GiteeStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const find = await queryRunner.manager.findOne(
      GiteeStorageProviderEntity,
      sid,
    );
    await queryRunner.release();
    return find;
  }

  async create(
    storage: GiteeStorageProviderEntity,
  ): Promise<GiteeStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newStorage = queryRunner.manager.create(
        GiteeStorageProviderEntity,
        storage,
      );
      const save = await queryRunner.manager.save(newStorage);
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
    oldS: GiteeStorageProviderEntity,
    newS: GiteeStorageProviderEntity,
  ): Promise<GiteeStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const storage = queryRunner.manager.merge(
        GiteeStorageProviderEntity,
        oldS,
        newS,
      );
      const save = await queryRunner.manager.save(storage);
      await queryRunner.commitTransaction();
      return save;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async delete(cid: number): Promise<DeleteResult> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const del = await queryRunner.manager.delete(
        GiteeStorageProviderEntity,
        cid,
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
