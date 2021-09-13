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
}
