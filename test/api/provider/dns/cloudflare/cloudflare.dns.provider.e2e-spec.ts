import { MetaWorker } from '@metaio/worker-model';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonModule } from 'nest-winston';

import { CloudFlareDnsProvider } from '../../../../../src/api/provider/dns/cloudflare/cloudflare.dns.provider';
import { configBuilder } from '../../../../../src/configs';
import { WinstonConfigService } from '../../../../../src/configs/winston';

describe('CloudFlareDnsProvider (e2e)', () => {
  let configService: ConfigService;
  let dnsProvider: CloudFlareDnsProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configBuilder],
        }),
        WinstonModule.forRootAsync({
          inject: [ConfigService],
          useClass: WinstonConfigService,
        }),
        HttpModule,
      ],
      providers: [CloudFlareDnsProvider],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    dnsProvider = module.get<CloudFlareDnsProvider>(CloudFlareDnsProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(dnsProvider).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('updateDnsRecord', () => {
    it('root', async () => {
      const dns = {
        providerType: MetaWorker.Enums.DnsProviderType.CLOUDFLARE,
        env: {
          token: configService.get<string>('provider.dns.cloudflare.token'),
          zoneId: configService.get<string>('provider.dns.cloudflare.zoneId'),
        },
        record: {
          type: MetaWorker.Enums.DnsRecordType.CNAME,
          name: 'skd',
          content: 'SKDawkins.github.io',
        },
      };
      console.log(dns);
      await dnsProvider.updateDnsRecord(dns);
    });
  });
});
