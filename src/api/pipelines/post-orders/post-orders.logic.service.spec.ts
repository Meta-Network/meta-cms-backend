import {
  authorPostDigest,
  authorPostDigestSign,
  KeyPair,
  serverVerificationSignWithContent,
} from '@metaio/meta-signature-util-v2';
import { LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';

import { WinstonConfigService } from '../../../configs/winston';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import { PostOrdersBaseService } from './post-orders.base.service';
import { PostOrdersLogicService } from './post-orders.logic.service';

describe('PostOrdersBaseService', () => {
  let logger: LoggerService;
  let configService: ConfigService;
  let postOrdersBaseService: PostOrdersBaseService;
  let service: PostOrdersLogicService;
  let eventEmitter: EventEmitter2;

  const authorKeys = {
    private:
      '0x90b2110acb0a981f4b6748fd67372c11daaa5f8c2cb8db42beadfd5bfb3b3a4c',
    public:
      '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
  } as KeyPair;
  const serverKeys = {
    private:
      '0x20db0762690fa66a1534de672822c65c71b9be027b2962e3560cb0238d89a073',
    public:
      '0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f',
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                name: 'meta-cms-test',
              },
              metaSignature: {
                serverKeys,
                serverDomain: 'meta-cms.vercel.mttk.net',
              },
            }),
          ],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
        EventEmitterModule.forRoot(),
      ],
      providers: [
        {
          provide: PostOrdersLogicService,
          useFactory: () => service,
        },
      ],
    }).compile();
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get(WINSTON_MODULE_NEST_PROVIDER);
    postOrdersBaseService = new PostOrdersBaseService(logger, undefined);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    service = new PostOrdersLogicService(
      logger,
      configService,
      postOrdersBaseService,
      eventEmitter,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('savePostOrder', () => {
    it('should return postOrderResponseDto & emit realTimeEvent if request is valid', async () => {
      const digest = authorPostDigest.generate({
        title: `测试标题`,
        content: `测试内容`,
        summary: `测试内容`,
        cover: 'https://example.com/test-cover.png',
        categories: '测试分类',
        tags: '测试标签1,测试标签2',
        license: 'CC 4.0',
      });
      const sign = authorPostDigestSign.generate(
        authorKeys,
        'meta-cms.mttk.net',
        digest.digest,
      );
      const postOrderRequestDto = {
        authorPostDigest: digest,
        authorPostSign: sign,
      } as PostOrderRequestDto;
      const userId = 1;
      jest
        .spyOn(postOrdersBaseService, 'create')
        .mockImplementationOnce((postOrder: PostOrderEntity) => {
          return {
            ...postOrder,
            submitState: PipelineOrderTaskCommonState.PENDING,
            publishState: PipelineOrderTaskCommonState.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });
      jest
        .spyOn(postOrdersBaseService, 'save')
        .mockImplementationOnce(async (postOrder: PostOrderEntity) => {
          return {
            ...postOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });
      const result = await service.savePostOrder(userId, postOrderRequestDto);
      const resultJson = JSON.stringify(result);
      const codecResult = JSON.parse(resultJson);

      codecResult.postOrder.createdAt = new Date(
        codecResult.postOrder.createdAt,
      );
      codecResult.postOrder.updatedAt = new Date(
        codecResult.postOrder.updatedAt,
      );

      codecResult.postOrder.postMetadata.createdAt = new Date(
        codecResult.postOrder.postMetadata.createdAt,
      );
      codecResult.postOrder.postMetadata.updatedAt = new Date(
        codecResult.postOrder.postMetadata.updatedAt,
      );

      expect(result).toBeDefined();
      expect(result.postOrder.id).toBe(sign.signature);
      expect(result.serverVerification.publicKey).toBe(serverKeys.public);
      expect(result.postOrder.serverVerificationId).toBe(
        result.serverVerification.signature,
      );
      expect(result.serverVerification.reference.length).toBe(2);

      expect(
        serverVerificationSignWithContent.verify(result.serverVerification),
      ).toBeTruthy();
      expect(result).toEqual(codecResult);
      expect(result.serverVerification.reference.length).toBe(2);
      expect(result.serverVerification.reference[0]).toEqual({
        refer: digest.digest,
        rel: 'content',
        body: digest,
      });
      expect(result.serverVerification.reference[1]).toEqual({
        refer: sign.signature,
        rel: 'request',
        body: sign,
      });
    });
  });
});
