import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeORMConfigService } from '../../../configs/typeorm';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { DomainvalidateStatus } from '../../../types/enum';
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
  let siteConfigRepository: Repository<SiteConfigEntity>;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [mockConfig],
        }),
        TypeOrmModule.forRootAsync({
          useClass: TypeORMConfigService,
        }),
        TypeOrmModule.forFeature([SiteConfigEntity]),
      ],
      providers: [DomainValidateService],
    }).compile();

    service = module.get<DomainValidateService>(DomainValidateService);
    siteConfigRepository = module.get<Repository<SiteConfigEntity>>(
      getRepositoryToken(SiteConfigEntity),
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(siteConfigRepository).toBeDefined();
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
