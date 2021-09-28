import { Module } from '@nestjs/common';

import { CloudFlareDnsProvider } from './cloudflare/cloudflare.dns.provider';
import { DnsService } from './dns.service';

@Module({
  providers: [CloudFlareDnsProvider, DnsService],
  exports: [DnsService],
})
export class DnsModule {}
