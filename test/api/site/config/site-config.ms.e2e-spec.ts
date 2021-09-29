import { MetaInternalResult, ServiceCode } from '@metaio/microservice-model';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';

import { SiteConfigLogicService } from '../../../../src/api/site/config/logicService';
import { SiteConfigMsController } from '../../../../src/api/site/config/ms.controller';

describe('SiteConfigMsController (e2e)', () => {
  let app: INestApplication;
  let appMsClient: ClientProxy;
  let siteConfigLogicService: SiteConfigLogicService;
  beforeEach(async () => {
    siteConfigLogicService = new SiteConfigLogicService(null, null);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
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
        {
          provide: SiteConfigLogicService,
          useFactory: () => siteConfigLogicService,
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
    const mockSiteInfos = [
      {
        userId: 11,
        configId: 22,
        title: 'Test Site',
        subtitle: 'Test sub title',
        domain: 'bob.metaspaces.life',
        metaSpacePrefix: 'bob',
      },
      {
        userId: 13,
        configId: 24,
        title: 'Alice  wonder world',
        subtitle: 'Rabbit hole',
        domain: 'alice.metaspaces.life',
        metaSpacePrefix: 'alice',
      },
    ];
    const metaInternalResult = new MetaInternalResult({
      serviceCode: ServiceCode.CMS,
      data: mockSiteInfos,
    });
    jest
      .spyOn(siteConfigLogicService, 'fetchSiteInfos')
      .mockImplementation(async (modifiedAfter) => metaInternalResult);
    const result = await firstValueFrom(
      appMsClient.send<MetaInternalResult>('syncSiteInfo', new Date()),
    );
    expect(result.statusCode).toBe(HttpStatus.OK);
    console.log(result.data);
    expect(result.data).toEqual(mockSiteInfos);
  });
});
