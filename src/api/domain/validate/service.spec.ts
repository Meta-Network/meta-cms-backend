import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DomainvalidateStatus } from '../../../types/enum';
import { SiteConfigModule } from '../../site/config/module';
import { DomainvalidateResult } from './dto';
import { DomainValidateService } from './service';

const mockConfig = () => ({
  metaSpace: {
    prefix: {
      reserve: ['metanetwork'],
      disable: ['fuck'],
    },
  },
});

describe('DomainValidateService', () => {
  let module: TestingModule;
  let service: DomainValidateService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [mockConfig],
        }),
        SiteConfigModule,
      ],
      providers: [DomainValidateService],
    }).compile();

    service = module.get<DomainValidateService>(DomainValidateService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('"metanetwork" should be a reserve prefix', async () => {
    const prefix = 'metanetwork';
    const data = await service.validateMetaSpacePrefix(prefix);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Reserve,
    });
  });

  it('"metanetvvork" should be a reserve prefix', async () => {
    const prefix = 'metanetvvork';
    const data = await service.validateMetaSpacePrefix(prefix);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Reserve,
    });
  });

  it('"fuck" should be a disable prefix', async () => {
    const prefix = 'fuck';
    const data = await service.validateMetaSpacePrefix(prefix);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Disable,
    });
  });
});
