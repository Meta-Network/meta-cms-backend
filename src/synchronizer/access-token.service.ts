import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AccessTokenEntity } from '../entities/accessToken.entity';

@Injectable()
export class AccessTokenService {
  constructor(
    @InjectRepository(AccessTokenEntity)
    private repository: Repository<AccessTokenEntity>,
  ) {}

  async save(userId: number, platform: string, accessToken: string) {
    const entity = this.repository.create({ userId, platform, accessToken });

    await this.repository.save(entity);
  }

  async read(userId: number) {
    return await this.repository.find({ where: { userId } });
  }

  async updateActive(userId: number, platform: string, active: boolean) {
    const token = await this.repository.findOneOrFail({
      where: { userId, platform },
    });
    token.active = active;

    await this.repository.save(token);

    return token;
  }

  async hasAny(userId: number) {
    return (await this.repository.count({ where: { userId } })) > 0;
  }
}
