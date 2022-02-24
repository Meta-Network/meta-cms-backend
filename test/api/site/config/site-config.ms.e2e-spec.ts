import { MetaInternalResult, ServiceCode } from '@metaio/microservice-model';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';

import { SiteConfigBaseService } from '../../../../src/api/site/config/baseService';
import {
  FetchSiteInfosReturn,
  SiteConfigLogicService,
} from '../../../../src/api/site/config/logicService';
import { SiteConfigMsController } from '../../../../src/api/site/config/ms.controller';
import { SiteInfoBaseService } from '../../../../src/api/site/info/baseService';
import { SiteInfoLogicService } from '../../../../src/api/site/info/logicService';
import { SiteConfigEntity } from '../../../../src/entities/siteConfig.entity';
import { SiteStatus } from '../../../../src/types/enum';
const mockConfig = () => ({
  metaSpace: {
    prefix: {
      reserve: ['metanetwork'],
      disable: ['fuck'],
    },
    baseDomain: 'metaspaces.life',
  },
});
describe('SiteConfigMsController (e2e)', () => {
  let app: INestApplication;
  let appMsClient: ClientProxy;
  let siteInfoBaseService: SiteInfoBaseService;
  let siteConfigBaseService: SiteConfigBaseService;
  let siteConfigLogicService: SiteConfigLogicService;
  beforeEach(async () => {
    siteInfoBaseService = new SiteInfoBaseService(undefined, undefined);
    siteConfigBaseService = new SiteConfigBaseService(undefined, undefined);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mockConfig],
        }),
        ClientsModule.register([
          {
            name: 'APP_MS_CLIENT',
            transport: Transport.NATS,
            options: {
              servers: ['nats://localhost:4222'],
              queue: 'meta_cms_test_queue',
            },
          },
        ]),
      ],
      controllers: [SiteConfigMsController],
      providers: [
        SiteConfigLogicService,
        SiteInfoLogicService,
        {
          provide: SiteConfigBaseService,
          useFactory: () => siteConfigBaseService,
        },
        {
          provide: SiteInfoBaseService,
          useFactory: () => siteInfoBaseService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.connectMicroservice({
      transport: Transport.NATS,
      options: {
        servers: ['nats://localhost:4222'],
        queue: 'meta_cms_test_queue',
      },
    });
    await app.startAllMicroservices();

    await app.init();
    appMsClient = app.get<ClientProxy>('APP_MS_CLIENT');
    await appMsClient.connect();
    siteConfigLogicService = app.get<SiteConfigLogicService>(
      SiteConfigLogicService,
    );
  });

  afterEach(async () => {
    if (appMsClient) {
      await appMsClient.close();
    }
    if (app) {
      await app.close();
    }
  });

  it('syncSiteInfo', async () => {
    const mockSiteInfos: FetchSiteInfosReturn[] = [
      {
        userId: 11,
        configId: 22,
        title: 'Test Site',
        subtitle: 'Test sub title',
        description: 'Test description',
        domain: 'bob.metaspaces.life',
        metaSpacePrefix: 'bob',
      },
      {
        userId: 13,
        configId: 24,
        title: 'Alice  wonder world',
        subtitle: 'Rabbit hole',
        domain: 'alice.metaspaces.life',
        description: 'Alice description',
        metaSpacePrefix: 'alice',
      },
    ];
    const metaInternalResult = new MetaInternalResult<FetchSiteInfosReturn[]>({
      serviceCode: ServiceCode.CMS,
      data: mockSiteInfos,
    });
    jest
      .spyOn(siteConfigLogicService, 'fetchSiteInfos')
      .mockImplementationOnce(async () => metaInternalResult);
    const result = await firstValueFrom(
      appMsClient.send('syncSiteInfo', { modifiedAfiter: new Date() }),
    );
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.data).toEqual(mockSiteInfos);
  });

  describe('fetchUserDefaultSiteInfo', () => {
    it('result data should be site info if site is published', async () => {
      const mockSiteInfo: SiteConfigEntity = {
        siteInfo: {
          id: 20,
          userId: 11,
          title: 'Test Site',
          subtitle: 'Test sub title',
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        id: 22,

        domain: 'bob.metaspaces.life',
        metaSpacePrefix: 'bob',
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPublishedAt: null,
        status: SiteStatus.Published,
      };

      jest
        .spyOn(siteConfigLogicService, 'getUserDefaultSiteConfig')
        .mockImplementationOnce(async () => {
          return mockSiteInfo;
        });
      const result = await firstValueFrom(
        appMsClient.send('fetchUserDefaultSiteInfo', { userId: 14 }),
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual({
        configId: 22,

        domain: 'bob.metaspaces.life',
        metaSpacePrefix: 'bob',

        userId: 11,
        title: 'Test Site',
        subtitle: 'Test sub title',
        description: 'Test description',
      });
    });

    it('result data should be null if site is not published', async () => {
      const mockSiteInfo: SiteConfigEntity = {
        siteInfo: {
          id: 20,
          userId: 11,
          title: 'Test Site',
          subtitle: 'Test sub title',
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        id: 22,

        domain: 'bob.metaspaces.life',
        metaSpacePrefix: 'bob',
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPublishedAt: null,
        status: SiteStatus.Configured,
      };

      jest
        .spyOn(siteConfigLogicService, 'getUserDefaultSiteConfig')
        .mockImplementationOnce(async () => {
          return mockSiteInfo;
        });
      const result = await firstValueFrom(
        appMsClient.send('fetchUserDefaultSiteInfo', { userId: 14 }),
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeNull();
    });

    it('result data should be null if site is not existed', async () => {
      jest
        .spyOn(siteConfigLogicService, 'getUserDefaultSiteConfig')
        .mockImplementationOnce(async () => {
          return null;
        });
      const result = await firstValueFrom(
        appMsClient.send('fetchUserDefaultSiteInfo', { userId: 14 }),
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeNull();
    });
  });
});
