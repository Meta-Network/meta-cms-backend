import { Module } from '@nestjs/common';

import { DnsWorkersService } from './dns-workers.service';
import { CloudFlareDnsProvider } from './provider/cloudflare.dns.provider';

@Module({
  providers: [CloudFlareDnsProvider, DnsWorkersService],
  exports: [DnsWorkersService],
})
export class DnsWorkersModule {}
