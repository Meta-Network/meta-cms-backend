import { MetaWorker } from '@metaio/worker-model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonModule } from 'nest-winston';

import { CloudFlareDnsProvider } from '../../../../src/api/provider/dns/cloudflare/cloudflare.dns.provider';
import { DnsService } from '../../../../src/api/provider/dns/dns.service';
import { configBuilder } from '../../../../src/configs';
import { WinstonConfigService } from '../../../../src/configs/winston';

describe('DnsService (e2e)', () => {
  let configService: ConfigService;
  let dnsWorkersService: DnsService;

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
      ],
      providers: [DnsService, CloudFlareDnsProvider],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    dnsWorkersService = module.get<DnsService>(DnsService);
  });

  it('should be defined', () => {
    expect(dnsWorkersService).toBeDefined();
  });

  describe('updateDnsRecord', () => {
    it('root', async () => {
      const dnsConfig = {
        providerType: MetaWorker.Enums.DnsProviderType.CLOUDFLARE,
        env: {
          token: configService.get<string>('provider.dns.cloudflare.token'),
          zoneId: configService.get<string>('provider.dns.cloudflare..zoneId'),
        },
      };
      console.log(dnsConfig);
      await dnsWorkersService.updateDnsRecord({
        type: MetaWorker.Enums.DnsRecordType.CNAME,
        name: 'andoroyur',
        content: 'willyandor.github.io',
      });
    });
  });
});
