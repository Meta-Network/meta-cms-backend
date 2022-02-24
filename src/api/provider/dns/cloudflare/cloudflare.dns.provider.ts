import { MetaWorker } from '@metaio/worker-model';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';

import { DnsProvider, registerDnsProvider } from '../dns.provider';

@Injectable()
export class CloudFlareDnsProvider implements DnsProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
  ) {
    registerDnsProvider(MetaWorker.Enums.DnsProviderType.CLOUDFLARE, this);
  }

  async updateDnsRecord(dns: MetaWorker.Info.Dns) {
    const dnsRecord = dns.record;
    if (
      MetaWorker.Enums.DnsRecordType.CNAME === dns.record.type &&
      dns.record.content &&
      typeof dns.record.content === 'string'
    ) {
      dns.record.content = dns.record.content.toLowerCase();
    }
    const res = this.httpService.get(
      `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records`,
      {
        params: {
          type: dns.record.type,
          content: dns.record.content,
        },
        headers: {
          Authorization: `Bearer ${dns.env.token}`,
        },
      },
    );
    const { data } = await lastValueFrom(res);
    this.logger.verbose(
      `List dns records: ${JSON.stringify(data)}`,
      this.constructor.name,
    );
    if (data.success) {
      const existingDnsRecords: any[] = data.result;
      //put
      if (existingDnsRecords && existingDnsRecords.length > 0) {
        try {
          const dnsRecordId = existingDnsRecords[0].id;
          const patchRes = this.httpService.patch(
            `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records/${dnsRecordId}`,
            {
              name: dnsRecord.name,
            },
            {
              headers: { Authorization: `Bearer ${dns.env.token}` },
            },
          );
          const { data } = await lastValueFrom(patchRes);
          this.logger.verbose(
            `Patch dns record: ${JSON.stringify(data)}`,
            this.constructor.name,
          );
          if (!data?.success) {
            new Error(data.messages.join(';'));
          }
        } catch (reason) {
          this.logger.error(
            `Http service PATCH ${reason}`,
            reason,
            this.constructor.name,
          );
        }
      }
      //post
      else {
        try {
          const postRes = this.httpService.post(
            `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records`,
            { ...dnsRecord, proxied: true },
            { headers: { Authorization: `Bearer ${dns.env.token}` } },
          );
          const { data } = await lastValueFrom(postRes);
          this.logger.verbose(
            `Post dns record: ${JSON.stringify(data)}`,
            this.constructor.name,
          );
          if (!data?.success) {
            new Error(data.messages.join(';'));
          }
        } catch (reason) {
          this.logger.error(
            `Http service POST ${reason}`,
            reason,
            this.constructor.name,
          );
        }
      }
    } else {
      throw new Error(data.messages.join(';'));
    }
  }
}
