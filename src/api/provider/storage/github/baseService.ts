import { Injectable } from '@nestjs/common';
import { Connection, DeleteResult } from 'typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';

@Injectable()
export class GitHubStorageBaseService {
  constructor(private connection: Connection) {}

  async read(sid: number): Promise<GitHubStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const find = await queryRunner.manager.findOne(
      GitHubStorageProviderEntity,
      sid,
    );
    await queryRunner.release();
    return find;
  }

  async create(
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newStorage = queryRunner.manager.create(
        GitHubStorageProviderEntity,
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
    oldS: GitHubStorageProviderEntity,
    newS: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const storage = queryRunner.manager.merge(
        GitHubStorageProviderEntity,
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
        GitHubStorageProviderEntity,
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
