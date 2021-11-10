import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) {
    this.reserveList = this.configService.get<string[]>(
      'metaSpace.prefix.reserve',
    );
    this.disableList = this.configService.get<string[]>(
      'metaSpace.prefix.disable',
    );
  }

  private readonly reserveList: string[];
  private readonly disableList: string[];

  private async checkPrefixIsExists(value: string): Promise<boolean> {
    const data = await this.siteConfigRepository.count({
      where: { metaSpacePrefix: value },
    });
    if (data > 0) return true;
    return false;
  }

  private async checkPrefixIsReserve(value: string): Promise<boolean> {
    const prefixPattern = /^[a-z0-9-]{3,15}$/;
    const replacePattern =
      /.*[mw]+[e3]+t+[a6]+[nu]+[e3]+t+(?:[w]|u{2}|v{2})+[o0]+r+k+.*/;
    const isMatchPrefixPattern = prefixPattern.test(value);
    const isMatchReplacePattern = replacePattern.test(value);
    const isListInclude = this.reserveList.includes(value);
    if (isMatchPrefixPattern && (isMatchReplacePattern || isListInclude)) {
      return true;
    }
    return false;
  }

  private async checkPrefixIsBanned(value: string): Promise<boolean> {
    if (this.disableList.includes(value)) {
      return true;
    }
    return false;
  }

  public async validateMetaSpacePrefix(
    prefix: string,
  ): Promise<DomainvalidateResult> {
    const reserve = await this.checkPrefixIsReserve(prefix);
    if (reserve) {
      return { value: prefix, status: DomainvalidateStatus.Reserve };
    }
    const banned = await this.checkPrefixIsBanned(prefix);
    if (banned) {
      return { value: prefix, status: DomainvalidateStatus.Disable };
    }
    const occupied = await this.checkPrefixIsExists(prefix);
    if (occupied) {
      return { value: prefix, status: DomainvalidateStatus.Occupied };
    }
    return { value: prefix, status: DomainvalidateStatus.Available };
  }
}
