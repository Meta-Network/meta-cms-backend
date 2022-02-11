import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { DnsService } from './dns.service';

@Injectable()
export class WorkerModel2DnsService {
  constructor(private readonly dnsService: DnsService) {}

  async updateDnsRecord(dnsRecord: MetaWorker.Info.DnsRecord) {
    return await this.dnsService.updateDnsRecord(dnsRecord);
  }
  getDns(dnsRecord: MetaWorker.Info.DnsRecord): MetaWorker.Info.Dns {
    return this.dnsService.getDns(dnsRecord);
  }
}
