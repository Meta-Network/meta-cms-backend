import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

import { AccessTokenEntity } from '../../entities/accessToken.entity';

@Injectable()
export class AccessTokenService {
  constructor(private connection: Connection) {}

  async save(userId: number, platform: string, accessToken: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = queryRunner.manager.create(AccessTokenEntity, {
        userId,
        platform,
        accessToken,
        active: false,
      });
      await queryRunner.manager.save(entity);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async read(userId: number) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const tokens = await queryRunner.manager.find(AccessTokenEntity, {
      where: { userId },
    });
    await queryRunner.release();
    return tokens;
  }

  async updateActive(userId: number, platform: string, active: boolean) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const token = await queryRunner.manager.findOneOrFail(AccessTokenEntity, {
        where: { userId, platform },
      });
      token.active = active;
      await queryRunner.manager.save(token);
      await queryRunner.commitTransaction();
      return token;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }

  async hasAny(userId: number, platform?: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    const where = !platform ? { userId } : { userId, platform };
    const count = await queryRunner.manager.count(AccessTokenEntity, { where });
    await queryRunner.release();
    return count > 0;
  }

  async remove(userId: number, platform: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = await queryRunner.manager.findOne(AccessTokenEntity, {
        where: { userId, platform },
      });
      if (!entity) {
        return;
      }
      await queryRunner.manager.remove(entity);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // TODO: Friendly error message
    } finally {
      await queryRunner.release();
    }
  }
}
