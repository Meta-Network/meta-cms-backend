import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { getDnsProvider } from './dns.provider';

@Injectable()
export class DnsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async updateDnsRecord(dnsRecord: MetaWorker.Info.DnsRecord) {
    const dns = this.getDns(dnsRecord);
    this.logger.verbose(
      `Dns config: ${JSON.stringify(dns)}`,
      this.constructor.name,
    );
    await getDnsProvider(dns.providerType).updateDnsRecord(dns);
  }
  getDns(dnsRecord: MetaWorker.Info.DnsRecord): MetaWorker.Info.Dns {
    // config
    const providerType =
      this.configService.get<MetaWorker.Enums.DnsProviderType>(
        'provider.dns.type',
      );
    const dns: MetaWorker.Info.Dns = {
      providerType,
      env: {},
      record: dnsRecord,
    };
    if (MetaWorker.Enums.DnsProviderType.CLOUDFLARE === providerType) {
      dns.env.token = this.configService.get<string>(
        'provider.dns.cloudflare.token',
      );
      dns.env.zoneId = this.configService.get<string>(
        'provider.dns.cloudflare.zone-id',
      );
    }
    return dns;
  }
}
