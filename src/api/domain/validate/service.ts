import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DomainvalidateStatus } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { DomainvalidateResult } from './dto';

@Injectable()
export class DomainValidateService {
  constructor(
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly configService: ConfigService,
  ) {
    this.reserveList = this.configService.get<string[]>(
      'metaSpace.prefix.reserve',
      [],
    );
    this.disableList = this.configService.get<string[]>(
      'metaSpace.prefix.disable',
      [],
    );
  }

  private readonly reserveList: string[];
  private readonly disableList: string[];

  private async checkPrefixIsExists(value: string): Promise<boolean> {
    return await this.siteConfigLogicService.checkPrefixIsExists(value);
  }

  private async checkPrefixIsReserve(value: string): Promise<boolean> {
    const prefixPattern = /^[a-z0-9-]{3,15}$/;
    const metanetworkPattern =
      /.*[mw]+[e3]+t+[a6]+[nu]+[e3]+t+(?:[w]|u{2}|v{2})+[o0]+r+k+.*/;
    const metaspacePattern = /.*[mw]+[e3]+t+[a6]+[s5]+[pbq]+[a6]+[c]+[e3]+.*/;
    const isMatchPrefixPattern = prefixPattern.test(value);
    const isMatchReplacePattern =
      metanetworkPattern.test(value) || metaspacePattern.test(value);
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
    const lowerCasePrefix = prefix.toLocaleLowerCase();
    const reserve = await this.checkPrefixIsReserve(lowerCasePrefix);
    if (reserve) {
      return { value: prefix, status: DomainvalidateStatus.Reserve };
    }
    const banned = await this.checkPrefixIsBanned(lowerCasePrefix);
    if (banned) {
      return { value: prefix, status: DomainvalidateStatus.Disable };
    }
    const occupied = await this.checkPrefixIsExists(lowerCasePrefix);
    if (occupied) {
      return { value: prefix, status: DomainvalidateStatus.Occupied };
    }
    return { value: prefix, status: DomainvalidateStatus.Available };
  }
}
