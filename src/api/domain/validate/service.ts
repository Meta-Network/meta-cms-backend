import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { DomainvalidateStatus } from '../../../types/enum';
import { DomainvalidateResult } from './dto';

@Injectable()
export class DomainValidateService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly siteConfigRepository: Repository<SiteConfigEntity>,
  ) {}

  private async checkPrefixIsExists(value: string): Promise<boolean> {
    const data = await this.siteConfigRepository.count({
      where: { metaSpacePrefix: value },
    });
    if (data > 0) return true;
    return false;
  }

  async validateMetaSpacePrefix(prefix: string): Promise<DomainvalidateResult> {
    const occupied = await this.checkPrefixIsExists(prefix);
    if (occupied)
      return { value: prefix, status: DomainvalidateStatus.Occupied };
    return { value: prefix, status: DomainvalidateStatus.Available };
  }
}
