import { Module } from '@nestjs/common';

import { CloudFlareDnsProvider } from './cloudflare/cloudflare.dns.provider';
import { DnsService } from './dns.service';
import { WorkerModel2DnsService } from './worker-model2.dns.service';

@Module({
  providers: [CloudFlareDnsProvider, DnsService, WorkerModel2DnsService],
  exports: [DnsService, WorkerModel2DnsService],
})
export class DnsModule {}
