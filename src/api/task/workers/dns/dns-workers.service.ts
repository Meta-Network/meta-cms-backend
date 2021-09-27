import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  DnsConfig,
  DnsProviderType,
  DnsRecord,
  getDnsProvider,
} from './provider/dns.provider';

@Injectable()
export class DnsWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async updateDnsRecord(dnsRecord: DnsRecord) {
    const dnsConfig = this.getDnsConfig();
    this.logger.verbose(
      `Dns config: ${JSON.stringify(dnsConfig)}`,
      this.constructor.name,
    );
    await getDnsProvider(dnsConfig.providerType).updateDnsRecord(
      dnsConfig,
      dnsRecord,
    );
  }
  getDnsConfig(): DnsConfig {
    // config
    const providerType = this.configService.get<DnsProviderType>(
      'task.worker.dns.provider-type',
    );
    const dnsConfig: DnsConfig = {
      providerType,
      env: {},
    };
    if (DnsProviderType.CLOUDFLARE === providerType) {
      dnsConfig.env.token = this.configService.get<string>(
        'cloudflare.api.dns.token',
      );
      dnsConfig.env.zoneId = this.configService.get<string>(
        'cloudflare.api.dns.zone-id',
      );
    }
    return dnsConfig;
  }
}
