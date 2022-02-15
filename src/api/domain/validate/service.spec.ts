import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DomainvalidateStatus } from '../../../types/enum';
import { SiteConfigBaseService } from '../../site/config/baseService';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { SiteConfigModule } from '../../site/config/module';
import { SiteInfoLogicService } from '../../site/info/logicService';
import { DomainvalidateResult } from './dto';
import { DomainValidateService } from './service';

const mockConfig = () => ({
  metaSpace: {
    prefix: {
      reserve: ['metanetwork'],
      disable: ['fuck'],
    },
    baseDomain: 'metaspaces.life',
  },
});

describe('DomainValidateService', () => {
  let module: TestingModule;
  let service: DomainValidateService;
  let configService: ConfigService;
  let siteConfigLogicService: SiteConfigLogicService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [mockConfig],
        }),
      ],
      providers: [
        DomainValidateService,
        {
          provide: SiteConfigBaseService,
          useFactory: () => null,
        },
        {
          provide: SiteInfoLogicService,
          useFactory: () => null,
        },
        SiteConfigLogicService,
      ],
    }).compile();

    service = module.get<DomainValidateService>(DomainValidateService);
    configService = module.get<ConfigService>(ConfigService);
    siteConfigLogicService = module.get<SiteConfigLogicService>(
      SiteConfigLogicService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('"metanetwork" should be a reserve prefix', async () => {
    const prefix = 'metanetwork';
    const data = await service.validateMetaSpacePrefix(prefix, 1);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Reserve,
    });
  });

  it('"metanetvvork" should be a reserve prefix', async () => {
    const prefix = 'metanetvvork';
    const data = await service.validateMetaSpacePrefix(prefix, 1);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Reserve,
    });
  });

  it('"fuck" should be a disable prefix', async () => {
    const prefix = 'fuck';
    const data = await service.validateMetaSpacePrefix(prefix, 1);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Disable,
    });
  });

  it('"alice" should be a occupied prefix if there is already a site config with this prefix', async () => {
    const prefix = 'prefix';
    jest
      .spyOn(siteConfigLogicService, 'checkPrefixIsExists')
      .mockImplementationOnce(async (prefix) => true);
    jest
      .spyOn(siteConfigLogicService, 'getUserDefaultSiteConfig')
      .mockImplementationOnce(async (userId: number) => undefined);

    const data = await service.validateMetaSpacePrefix(prefix, 1);
    expect(data).toMatchObject<DomainvalidateResult>({
      value: prefix,
      status: DomainvalidateStatus.Occupied,
    });
  });
});
