import {
  authorPostDigest,
  authorPostDigestSign,
  KeyPair,
} from '@metaio/meta-signature-util-v2';
import { LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonModule } from 'nest-winston';

import { WinstonConfigService } from '../../../configs/winston';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { AccessDeniedException } from '../../../exceptions';
import {
  MetadataStorageType,
  PipelineOrderTaskCommonState,
} from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import { DeploySiteOrderRequestDto } from '../dto/site-order.dto';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publlish-site-orders.base.service';
import { SiteOrdersLogicService } from './site-orders.logic.service';

describe('SiteOrdersLogicService', () => {
  let logger: LoggerService;
  let configService: ConfigService;
  const deploySiteOrdersBaseService = new DeploySiteOrdersBaseService(
    logger,
    undefined,
  );
  const publishSiteOrdersBaseService = new PublishSiteOrdersBaseService(
    logger,
    undefined,
  );
  let siteConfigLogicService;
  const postOrdersLogicService = new PostOrdersLogicService(
    logger,
    configService,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  const serverVerificationBaseService = new ServerVerificationBaseService(
    logger,
    undefined,
  );
  let service: SiteOrdersLogicService;

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
              metaSpace: {
                baseDomain: 'metaspaces.life',
              },
            }),
          ],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
      ],
      providers: [
        {
          provide: DeploySiteOrdersBaseService,
          useFactory: () => deploySiteOrdersBaseService,
        },
        {
          provide: PublishSiteOrdersBaseService,
          useFactory: () => publishSiteOrdersBaseService,
        },
        {
          provide: PostOrdersLogicService,
          useFactory: () => postOrdersLogicService,
        },
        {
          provide: SiteConfigLogicService,
          inject: [ConfigService],
          useFactory: (config) =>
            new SiteConfigLogicService(undefined, undefined, config),
        },
        {
          provide: ServerVerificationBaseService,
          useFactory: () => serverVerificationBaseService,
        },

        SiteOrdersLogicService,
      ],
    }).compile();

    siteConfigLogicService = module.get<SiteConfigLogicService>(
      SiteConfigLogicService,
    );
    service = module.get<SiteOrdersLogicService>(SiteOrdersLogicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveDeploySiteOrder', () => {
    it('create deploySiteOrderRequestDto', async () => {
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
      console.log(
        JSON.stringify({
          siteConfigId: 214,
          authorPostDigest: digest,
          authorPostSign: sign,
        }),
      );
    });
    it('should return deploySiteOrderResponseDto', async () => {
      const siteConfigId = 11;
      const deploySiteOrderRequestDto = {
        siteConfigId,
        authorPostDigest: {
          '@context': 'https://metanetwork.online/ns/cms',
          '@type': 'author-post-digest',
          '@version': '1.1.0',
          algorithm: 'sha256',
          title: '测试标题',
          content: '测试内容',
          summary: '测试内容',
          cover: 'https://example.com/test-cover.png',
          categories: '测试分类',
          tags: '测试标签1,测试标签2',
          license: 'CC 4.0',
          digest:
            '0x6128a1423ac8239101ef76ee2c730452da0af0581685837de65b6853a2497ff9',
          ts: 1643357435230,
        },
        authorPostSign: {
          '@context': 'https://metanetwork.online/ns/cms',
          '@type': 'author-digest-sign',
          '@version': '2.0.0',
          signatureAlgorithm: 'curve25519',
          publicKey:
            '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
          digest:
            '0x6128a1423ac8239101ef76ee2c730452da0af0581685837de65b6853a2497ff9',
          nonce: '0x8233a0a14766b37324c42316',
          claim:
            'I signed with my key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e from this device: I authorize meta-cms.mttk.net to publish this post and upload its metadata for notarization.',
          signature:
            '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
          ts: 1643357435231,
        },
      } as DeploySiteOrderRequestDto;
      console.log(
        'deploySiteOrderRequestDto',
        JSON.stringify(deploySiteOrderRequestDto),
      );

      jest
        .spyOn(siteConfigLogicService, 'validateSiteConfigUserId')
        .mockImplementation(
          async (siteConfigId: number, userId: number, options) => {
            const siteConfigEntity = {
              id: siteConfigId,
              siteInfo: { userId },
            } as SiteConfigEntity;
            return siteConfigEntity;
          },
        );
      jest
        .spyOn(postOrdersLogicService, 'savePostOrder')
        .mockImplementation(async (userId: number, postOrderRequestDto) => {
          return {
            postOrder: {
              id: '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
              userId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              postMetadata: {
                id: '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
                '@context': 'https://metanetwork.online/ns/cms',
                '@type': 'author-post-digest',
                '@version': '1.1.0',
                algorithm: 'sha256',
                title: '测试标题',
                content: '测试内容',
                summary: '测试内容',
                cover: 'https://example.com/test-cover.png',
                categories: '测试分类',
                tags: '测试标签1,测试标签2',
                license: 'CC 4.0',
                digest:
                  '0x6128a1423ac8239101ef76ee2c730452da0af0581685837de65b6853a2497ff9',
                ts: 1643357435230,
                authorPublicKey:
                  '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
                createdAt: new Date(),
              },
              serverVerificationId:
                '0xe7c305eb985f9b97da5795550873da24b6fc8e8ff2447500a666b8e09c9a61e4d192fed5cd2b12b9630836d8c93293ea35cc92103efa8f52d21a3182fe27d30e',
              submitState: PipelineOrderTaskCommonState.PENDING,
              publishState: PipelineOrderTaskCommonState.PENDING,
            },
            serverVerification: {
              '@context': 'https://metanetwork.online/ns/cms',
              '@type': 'server-verification-sign',
              '@version': '2.0.0',
              signatureAlgorithm: 'curve25519',
              publicKey:
                '0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f',
              nonce: '0x1ee5789d5b0ac18d121a6dea',
              claim:
                "I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.",
              signature:
                '0xe7c305eb985f9b97da5795550873da24b6fc8e8ff2447500a666b8e09c9a61e4d192fed5cd2b12b9630836d8c93293ea35cc92103efa8f52d21a3182fe27d30e',
              ts: 1643357435538,
              reference: [],
            },
          };
        });
      jest
        .spyOn(deploySiteOrdersBaseService, 'save')
        .mockImplementation(async (deploySiteOrderEntity) => {
          return deploySiteOrderEntity;
        });
      jest
        .spyOn(deploySiteOrdersBaseService, 'getBySiteConfigUserId')
        .mockImplementation(async (siteConfigId: number, userId: number) => {
          // {
          //   id: '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
          //   userId,
          //   siteConfigId,
          //   createdAt: new Date(),
          //   updatedAt: new Date(),
          // };
          return undefined;
        });
      const userId = 1;
      const deploySiteOrderResponseDto = await service.saveDeploySiteOrder(
        userId,
        deploySiteOrderRequestDto,
      );
      expect(deploySiteOrderResponseDto).toBeDefined();
      expect(deploySiteOrderResponseDto.serverVerification.signature).toEqual(
        deploySiteOrderResponseDto.deploySiteOrder.serverVerificationId,
      );
      expect(deploySiteOrderResponseDto.deploySiteOrder.id).toEqual(
        deploySiteOrderRequestDto.authorPostSign.signature,
      );
    });
  });
});
