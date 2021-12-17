import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import superagent from 'superagent';
import { isString } from 'util';

import { DnsProvider, registerDnsProvider } from '../dns.provider';

@Injectable()
export class CloudFlareDnsProvider implements DnsProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
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
    const res = await superagent
      .get(
        `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records`,
      )
      .query({
        type: dns.record.type,
        content: dns.record.content,
      })
      .set('Authorization', `Bearer ${dns.env.token}`);
    this.logger.verbose(
      `List dns records: ${JSON.stringify(res.body)}`,
      this.constructor.name,
    );
    if (res.body.success) {
      const existingDnsRecords: any[] = res.body.result;
      //put
      if (existingDnsRecords && existingDnsRecords.length > 0) {
        const dnsRecordId = existingDnsRecords[0].id;
        const patchRes = await superagent
          .patch(
            `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records/${dnsRecordId}`,
          )
          .send({
            name: dnsRecord.name,
          })
          .set('Authorization', `Bearer ${dns.env.token}`)
          .catch((reason) =>
            this.logger.error(
              `Superagent PATCH ${reason}`,
              reason,
              this.constructor.name,
            ),
          );
        this.logger.verbose(
          `Patch dns record: ${JSON.stringify(patchRes.body)}`,
          this.constructor.name,
        );
        if (!patchRes?.body?.success) {
          new Error(patchRes.body.messages.join(';'));
        }
      }
      //post
      else {
        const postRes = await superagent
          .post(
            `https://api.cloudflare.com/client/v4/zones/${dns.env.zoneId}/dns_records`,
          )
          .send({ ...dnsRecord, proxied: true })
          .set('Authorization', `Bearer ${dns.env.token}`)
          .catch((reason) =>
            this.logger.error(
              `Superagent POST ${reason}`,
              reason,
              this.constructor.name,
            ),
          );
        this.logger.verbose(
          `Post dns record: ${JSON.stringify(postRes.body)}`,
          this.constructor.name,
        );
        if (!postRes?.body?.success) {
          new Error(postRes.body.messages.join(';'));
        }
      }
    } else {
      throw new Error(res.body.messages.join(';'));
    }
  }
}
