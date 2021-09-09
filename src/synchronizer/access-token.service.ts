import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessTokenEntity } from '../entities/accessToken.entity';

@Injectable()
export class AccessTokenService {
  constructor(@InjectRepository(AccessTokenEntity) private repository: Repository<AccessTokenEntity>) { }

  async save(platform: string, accessToken: string) {
    const entity = this.repository.create({ platform, accessToken });

    await this.repository.save(entity);
  }
}
