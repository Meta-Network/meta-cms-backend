import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import superagent from 'superagent';

import {
  DnsConfig,
  DnsProvider,
  DnsProviderType,
  DnsRecord,
  registerDnsProvider,
} from './dns.provider';

@Injectable()
export class CloudFlareDnsProvider implements DnsProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    registerDnsProvider(DnsProviderType.CLOUDFLARE, this);
  }

  async updateDnsRecord(dnsConfig: DnsConfig, dnsRecord: DnsRecord) {
    console.log(dnsRecord);
    const res = await superagent
      .get(
        `https://api.cloudflare.com/client/v4/zones/${dnsConfig.env.zoneId}/dns_records`,
      )
      .set('Authorization', `Bearer ${dnsConfig.env.token}`);
    this.logger.verbose(
      `List dns records: ${JSON.stringify(res.body)}`,
      this.constructor.name,
    );
    if (res.body.success) {
      const dnsRecords: any[] = res.body.result;
      const existingDnsRecords = dnsRecords.filter(
        (r) => r.type === dnsRecord.type && r.content === dnsRecord.content,
      );
      //put
      if (existingDnsRecords.length > 0) {
        const dnsRecordId = existingDnsRecords[0].id;
        const patchRes = await superagent
          .patch(
            `https://api.cloudflare.com/client/v4/zones/${dnsConfig.env.zoneId}/dns_records/${dnsRecordId}`,
          )
          .send({
            name: dnsRecord.name,
            proxied: true,
          })
          .set('Authorization', `Bearer ${dnsConfig.env.token}`);
        this.logger.verbose(
          `Patch dns record: ${JSON.stringify(patchRes.body)}`,
          this.constructor.name,
        );

        if (!patchRes.body.success) {
          new Error(patchRes.body.messages.join(';'));
        }
      }
      //post
      else {
        const postRes = await superagent
          .post(
            `https://api.cloudflare.com/client/v4/zones/${dnsConfig.env.zoneId}/dns_records`,
          )
          .send(dnsRecord)
          .set('Authorization', `Bearer ${dnsConfig.env.token}`);
        this.logger.verbose(
          `Post dns record: ${JSON.stringify(postRes.body)}`,
          this.constructor.name,
        );
        if (!postRes.body.success) {
          new Error(postRes.body.messages.join(';'));
        }
      }
    } else {
      throw new Error(res.body.messages.join(';'));
    }
  }
}