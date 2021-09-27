import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';

@Injectable()
export class DomainFindService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
  ) {}

  async findMetaSpacePrefix(
    prefix: string,
    take: number,
  ): Promise<SiteConfigEntity[]> {
    return await this.siteConfigRepository.find({
      where: { metaSpacePrefix: Like(`%${prefix}%`) },
      relations: ['siteInfo'],
      cache: true,
      take,
    });
  }
}
