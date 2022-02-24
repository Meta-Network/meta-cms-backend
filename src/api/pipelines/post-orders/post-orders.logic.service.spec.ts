import {
  authorPostDigest,
  authorPostDigestSign,
  KeyPair,
  serverVerificationSignWithContent,
} from '@metaio/meta-signature-util-v2';
import { ConflictException, LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';

import { WinstonConfigService } from '../../../configs/winston';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import {
  InternalRealTimeEvent,
  MetadataStorageType,
  PipelineOrderTaskCommonState,
  RealTimeEventState,
} from '../../../types/enum';
import { MetaSignatureModule } from '../../meta-signature/meta-signature.module';
import { MetadataStorageService } from '../../provider/metadata-storage/metadata-storage.service';
import { InternalRealTimeMessage } from '../../real-time-event/real-time-event.datatype';
import { PostOrderRequestDto } from '../dto/post-order.dto';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { PostOrdersBaseService } from './post-orders.base.service';
import { PostOrdersLogicService } from './post-orders.logic.service';

describe('PostOrdersLogicService', () => {
  let logger: LoggerService;
  let configService: ConfigService;
  let metadataStorageService: MetadataStorageService;
  const postOrdersBaseService = new PostOrdersBaseService(
    logger,
    undefined,
    undefined,
  );
  let service: PostOrdersLogicService;
  let serverVerificationBaseService = new ServerVerificationBaseService(
    logger,
    undefined,
  );

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
              provider: {
                metadataStorage: {
                  arweave: {
                    walletKeyPath: 'config/arweave.json',
                  },
                },
              },
            }),
          ],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
        MetaSignatureModule,
        EventEmitterModule.forRoot(),
      ],
      providers: [
        // {
        //   provide: PostOrdersLogicService,
        //   useFactory: () => service,
        // },
        {
          provide: PostOrdersBaseService,
          useFactory: () => postOrdersBaseService,
        },
        {
          provide: ServerVerificationBaseService,
          useFactory: () => serverVerificationBaseService,
        },
        MetadataStorageService,
        PostOrdersLogicService,
      ],
    }).compile();
    logger = module.get(WINSTON_MODULE_NEST_PROVIDER);
    configService = module.get<ConfigService>(ConfigService);

    metadataStorageService = module.get<MetadataStorageService>(
      MetadataStorageService,
    );

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    // service = new PostOrdersLogicService(
    //   logger,
    //   configService,
    //   postOrdersBaseService,

    //   eventEmitter,
    // );
    serverVerificationBaseService = module.get<ServerVerificationBaseService>(
      ServerVerificationBaseService,
    );
    service = module.get<PostOrdersLogicService>(PostOrdersLogicService);
  });

  it('should be defined', () => {
    expect(metadataStorageService).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('savePostOrder', () => {
    it('should return postOrderResponseDto & emit realTimeEvent if request is valid', async () => {
      let eventData;
      eventEmitter.on(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        (data) => (eventData = data),
      );
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
        certificateStorageType: MetadataStorageType.ARWEAVE,
        authorPostDigest: digest,
        authorPostSign: sign,
      } as PostOrderRequestDto;
      console.log('postOrderRequestDto', JSON.stringify(postOrderRequestDto));
      const userId = 1;
      jest
        .spyOn(postOrdersBaseService, 'create')
        .mockImplementationOnce((postOrder: PostOrderEntity) => {
          return {
            ...postOrder,
            submitState: PipelineOrderTaskCommonState.PENDING,
            publishState: PipelineOrderTaskCommonState.PENDING,
          };
        });
      jest
        .spyOn(postOrdersBaseService, 'save')
        .mockImplementationOnce(async (postOrder: PostOrderEntity) => {
          return postOrder;
        });
      jest
        .spyOn(service, 'doUploadCertificate')
        .mockImplementation(async () => {
          return;
        });
      jest
        .spyOn(serverVerificationBaseService, 'save')
        .mockImplementationOnce(async (id: string, payload: string) => {
          // console.log(payload);
          return {
            id,
            payload,
            createdAt: new Date(),
          };
        });
      jest
        .spyOn(postOrdersBaseService, 'update')
        .mockImplementation(async () => {
          return;
        });
      jest
        .spyOn(postOrdersBaseService, 'find')
        .mockImplementationOnce(async () => {
          return [];
        });
      const result = await service.savePostOrder(userId, postOrderRequestDto);
      const resultJson = JSON.stringify(result);
      const codecResult = JSON.parse(resultJson);
      console.log('postOrderResponseDto', codecResult);
      expect(result).toBeDefined();
      expect(eventData).toBeDefined();
      expect(eventData).toEqual(
        new InternalRealTimeMessage({
          userId,
          message: InternalRealTimeEvent.POST_STATE_UPDATED,
          data: [
            {
              id: sign.signature,
              submit: RealTimeEventState.pending,
              publish: RealTimeEventState.pending,
            },
          ],
        }),
      );
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

    it('should throw bad request excpetion if author post digest is empty', async () => {
      const digest = authorPostDigest.generate({
        title: `测试标题`,
        content: `测试内容`,
        summary: `测试内容`,
        cover: 'https://example.com/test-cover.png',
        categories: '测试分类',
        tags: '测试标签1,测试标签2',
        license: 'CC 4.0',
      });
      digest.digest = '';
      const sign = authorPostDigestSign.generate(
        authorKeys,
        'meta-cms.mttk.net',
        digest.digest,
      );
      expect(
        async () =>
          await service.savePostOrder(1, {
            authorPostDigest: digest,
            authorPostSign: sign,
          }),
      ).rejects.toThrow('Invalid author post digest');
    });

    it('should throw bad request excpetion if author post digest is invalid', async () => {
      const digest = authorPostDigest.generate({
        title: `测试标题`,
        content: `测试内容`,
        summary: `测试内容`,
        cover: 'https://example.com/test-cover.png',
        categories: '测试分类',
        tags: '测试标签1,测试标签2',
        license: 'CC 4.0',
      });
      digest.digest = 'a';
      const sign = authorPostDigestSign.generate(
        authorKeys,
        'meta-cms.mttk.net',
        digest.digest,
      );
      expect(
        async () =>
          await service.savePostOrder(1, {
            authorPostDigest: digest,
            authorPostSign: sign,
          }),
      ).rejects.toThrow('Invalid author post digest');
    });

    it('should throw bad request excpetion if author post sign is invalid', async () => {
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
      sign.signature =
        '0xfcb51bedbc073bb5ca6505c5fe9a81e5b4798d8e21b7356a7a96abc23dee8e7dcbb579ac25f339db21a0ea9a5861604cc8a62b8b3c8fa3790770264f2ed5328b';
      expect(
        async () =>
          await service.savePostOrder(1, {
            authorPostDigest: digest,
            authorPostSign: sign,
          }),
      ).rejects.toThrow('Invalid author post sign');
    });

    it('should throw bad request excpetion if author post sign length is wrong', async () => {
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
      sign.signature = '0xa';
      expect(
        async () =>
          await service.savePostOrder(1, {
            authorPostDigest: digest,
            authorPostSign: sign,
          }),
      ).rejects.toThrow('wrong signature length');
    });
  });

  describe('retryPostOrder', () => {
    it('should update certificate state & return post order if certificate state is failed', async () => {
      let eventData;
      eventEmitter.on(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        (data) => (eventData = data),
      );
      const userId = 1,
        id =
          '0x8593560768e1f78c465e54ae70585661090e39a523d3b51939c3d962f24af7de9dd37c19c7fab9d50950804886bf95455036353a2c80f46d1d7a079ca0a6b489';
      jest
        .spyOn(postOrdersBaseService, 'save')
        .mockImplementationOnce(async (postOrderEntity) => ({
          ...postOrderEntity,
          updatedAt: new Date(),
        }));
      jest
        .spyOn(postOrdersBaseService, 'update')
        .mockImplementation(async () => {
          return;
        });
      jest
        .spyOn(postOrdersBaseService, 'getById')
        .mockImplementationOnce(async (id: string) => ({
          id,
          userId,
          submitState: PipelineOrderTaskCommonState.FAILED,
          publishState: PipelineOrderTaskCommonState.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
          serverVerificationId:
            '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          certificateStorageType: MetadataStorageType.ARWEAVE,
          certificateId: '',
          certificateState: PipelineOrderTaskCommonState.FAILED,
          postTaskId: '',
          publishSiteOrderId: 0,
          publishSiteTaskId: '',
          postMetadata: {
            id,
            title: `测试标题`,
            content: `测试内容`,
            summary: `测试内容`,
            cover: 'https://example.com/test-cover.png',
            categories: '测试分类',
            tags: '测试标签1,测试标签2',
            license: 'CC 4.0',
            digest:
              '0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8',
            authorPublicKey: authorKeys.public,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }));
      jest
        .spyOn(serverVerificationBaseService, 'getById')
        .mockImplementationOnce(async () => ({
          id: '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          payload: `{"@context":"https://metanetwork.online/ns/cms","@type":"server-verification-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","nonce":"0x426c1e9fd00c32945829bd2c","claim":"I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.","signature":"0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b","ts":1643268895159,"reference":[{"refer":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","rel":"content","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-post-digest","@version":"1.1.0","algorithm":"sha256","title":"测试标题","content":"测试内容","summary":"测试内容","cover":"https://example.com/test-cover.png","categories":"测试分类","tags":"测试标签1,测试标签2","license":"CC 4.0","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","ts":1643268894887}},{"refer":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","rel":"request","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-digest-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","nonce":"0xdb1e21433e00f3ea8e86eeb6","claim":"I signed with my key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e from this device: I authorize meta-cms.mttk.net to publish this post and upload its metadata for notarization.","signature":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","ts":1643268894887}}]}`,
          createdAt: new Date(),
        }));
      jest
        .spyOn(service, 'doUploadCertificate')
        .mockImplementation(async () => {
          return;
        });
      const result = await service.retryPostOrder(userId, id);
      expect(result).toBeDefined();
      expect(result.certificateState).toBe(
        PipelineOrderTaskCommonState.PENDING,
      );
      expect(result.submitState).toBe(PipelineOrderTaskCommonState.PENDING);
      expect(result.publishState).toBe(PipelineOrderTaskCommonState.PENDING);
      expect(result.postTaskId).toBeFalsy();
      expect(result.publishSiteOrderId).toBeFalsy();
      expect(result.publishSiteTaskId).toBeFalsy();
      expect(eventData).toBeDefined();
      expect(eventData.userId).toEqual(userId);
      expect(eventData.data[0]).toEqual({
        id: result.id,
        submit: PipelineOrderTaskCommonState.PENDING,
        publish: PipelineOrderTaskCommonState.PENDING,
      });
    });

    it('should update submit state & return post order if submit state is failed', async () => {
      let eventData;
      eventEmitter.on(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        (data) => (eventData = data),
      );
      const userId = 1,
        id =
          '0x8593560768e1f78c465e54ae70585661090e39a523d3b51939c3d962f24af7de9dd37c19c7fab9d50950804886bf95455036353a2c80f46d1d7a079ca0a6b489';
      jest
        .spyOn(postOrdersBaseService, 'save')
        .mockImplementationOnce(async (postOrderEntity) => ({
          ...postOrderEntity,
          updatedAt: new Date(),
        }));
      jest
        .spyOn(postOrdersBaseService, 'update')
        .mockImplementation(async () => {
          return;
        });
      jest
        .spyOn(postOrdersBaseService, 'getById')
        .mockImplementationOnce(async (id: string) => ({
          id,
          userId,
          submitState: PipelineOrderTaskCommonState.FAILED,
          publishState: PipelineOrderTaskCommonState.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
          serverVerificationId:
            '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          certificateStorageType: MetadataStorageType.ARWEAVE,
          certificateId: 'XYyD1wAcUctI8HA1BwL8Sp2BFDHElJ8w6wTlQATcz',
          certificateState: PipelineOrderTaskCommonState.FINISHED,
          postTaskId:
            'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
          publishSiteOrderId: 0,
          publishSiteTaskId: '',
          postMetadata: {
            id,
            title: `测试标题`,
            content: `测试内容`,
            summary: `测试内容`,
            cover: 'https://example.com/test-cover.png',
            categories: '测试分类',
            tags: '测试标签1,测试标签2',
            license: 'CC 4.0',
            digest:
              '0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8',
            authorPublicKey: authorKeys.public,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }));
      jest
        .spyOn(serverVerificationBaseService, 'getById')
        .mockImplementationOnce(async () => ({
          id: '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          payload: `{"@context":"https://metanetwork.online/ns/cms","@type":"server-verification-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","nonce":"0x426c1e9fd00c32945829bd2c","claim":"I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.","signature":"0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b","ts":1643268895159,"reference":[{"refer":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","rel":"content","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-post-digest","@version":"1.1.0","algorithm":"sha256","title":"测试标题","content":"测试内容","summary":"测试内容","cover":"https://example.com/test-cover.png","categories":"测试分类","tags":"测试标签1,测试标签2","license":"CC 4.0","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","ts":1643268894887}},{"refer":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","rel":"request","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-digest-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","nonce":"0xdb1e21433e00f3ea8e86eeb6","claim":"I signed with my key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e from this device: I authorize meta-cms.mttk.net to publish this post and upload its metadata for notarization.","signature":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","ts":1643268894887}}]}`,
          createdAt: new Date(),
        }));

      const result = await service.retryPostOrder(userId, id);
      expect(result).toBeDefined();
      expect(result.certificateState).toBe(
        PipelineOrderTaskCommonState.FINISHED,
      );
      expect(result.submitState).toBe(PipelineOrderTaskCommonState.PENDING);
      expect(result.publishState).toBe(PipelineOrderTaskCommonState.PENDING);
      expect(result.postTaskId).toBeFalsy();
      expect(result.publishSiteOrderId).toBeFalsy();
      expect(result.publishSiteTaskId).toBeFalsy();
      expect(eventData).toBeDefined();
      expect(eventData.userId).toEqual(userId);
      expect(eventData.data[0]).toEqual({
        id: result.id,
        submit: PipelineOrderTaskCommonState.PENDING,
        publish: PipelineOrderTaskCommonState.PENDING,
      });
    });
    it('should update publish state & return post order if publish state is failed', async () => {
      let eventData;
      eventEmitter.on(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        (data) => (eventData = data),
      );
      const userId = 1,
        id =
          '0x8593560768e1f78c465e54ae70585661090e39a523d3b51939c3d962f24af7de9dd37c19c7fab9d50950804886bf95455036353a2c80f46d1d7a079ca0a6b489';
      jest
        .spyOn(postOrdersBaseService, 'save')
        .mockImplementationOnce(async (postOrderEntity) => ({
          ...postOrderEntity,
          updatedAt: new Date(),
        }));
      jest
        .spyOn(postOrdersBaseService, 'update')
        .mockImplementation(async () => {
          return;
        });
      jest
        .spyOn(postOrdersBaseService, 'getById')
        .mockImplementationOnce(async (id: string) => ({
          id,
          userId,
          submitState: PipelineOrderTaskCommonState.FINISHED,
          publishState: PipelineOrderTaskCommonState.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
          serverVerificationId:
            '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          certificateStorageType: MetadataStorageType.ARWEAVE,
          certificateId: 'XYyD1wAcUctI8HA1BwL8Sp2BFDHElJ8w6wTlQATcz',
          certificateState: PipelineOrderTaskCommonState.FINISHED,
          postTaskId:
            'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
          publishSiteOrderId: 1,
          publishSiteTaskId:
            'wt4site-123-publsh-site-8bde738e-f25a-40cb-812d-ed6b2c09e28e',
          postMetadata: {
            id,
            title: `测试标题`,
            content: `测试内容`,
            summary: `测试内容`,
            cover: 'https://example.com/test-cover.png',
            categories: '测试分类',
            tags: '测试标签1,测试标签2',
            license: 'CC 4.0',
            digest:
              '0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8',
            authorPublicKey: authorKeys.public,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }));
      jest
        .spyOn(serverVerificationBaseService, 'getById')
        .mockImplementationOnce(async () => ({
          id: '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          payload: `{"@context":"https://metanetwork.online/ns/cms","@type":"server-verification-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","nonce":"0x426c1e9fd00c32945829bd2c","claim":"I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.","signature":"0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b","ts":1643268895159,"reference":[{"refer":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","rel":"content","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-post-digest","@version":"1.1.0","algorithm":"sha256","title":"测试标题","content":"测试内容","summary":"测试内容","cover":"https://example.com/test-cover.png","categories":"测试分类","tags":"测试标签1,测试标签2","license":"CC 4.0","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","ts":1643268894887}},{"refer":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","rel":"request","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-digest-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","nonce":"0xdb1e21433e00f3ea8e86eeb6","claim":"I signed with my key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e from this device: I authorize meta-cms.mttk.net to publish this post and upload its metadata for notarization.","signature":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","ts":1643268894887}}]}`,
          createdAt: new Date(),
        }));

      const result = await service.retryPostOrder(userId, id);
      expect(result).toBeDefined();
      expect(result.certificateState).toBe(
        PipelineOrderTaskCommonState.FINISHED,
      );
      expect(result.submitState).toBe(PipelineOrderTaskCommonState.FINISHED);
      expect(result.publishState).toBe(PipelineOrderTaskCommonState.PENDING);
      expect(result.postTaskId).toBe(
        'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
      );
      expect(result.publishSiteOrderId).toBeFalsy();
      expect(result.publishSiteTaskId).toBeFalsy();
      expect(eventData).toBeDefined();
      expect(eventData.userId).toEqual(userId);
      expect(eventData.data[0]).toEqual({
        id: result.id,
        publish: PipelineOrderTaskCommonState.PENDING,
      });
    });

    it('should throw DataNotFoundException if no post order matches', async () => {
      const userId = 1,
        id =
          '0x8593560768e1f78c465e54ae70585661090e39a523d3b51939c3d962f24af7de9dd37c19c7fab9d50950804886bf95455036353a2c80f46d1d7a079ca0a6b489';
      jest
        .spyOn(postOrdersBaseService, 'getById')
        .mockImplementationOnce(async (id: string) => ({
          id,
          userId: 2,
          submitState: PipelineOrderTaskCommonState.FAILED,
          publishState: PipelineOrderTaskCommonState.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
          serverVerificationId:
            '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          certificateStorageType: MetadataStorageType.ARWEAVE,
          certificateId: '',
          certificateState: PipelineOrderTaskCommonState.FAILED,
          postTaskId: '',
          publishSiteOrderId: 0,
          publishSiteTaskId: '',
          postMetadata: {
            id,
            title: `测试标题`,
            content: `测试内容`,
            summary: `测试内容`,
            cover: 'https://example.com/test-cover.png',
            categories: '测试分类',
            tags: '测试标签1,测试标签2',
            license: 'CC 4.0',
            digest:
              '0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8',
            authorPublicKey: authorKeys.public,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }));
      expect(
        async () => await service.retryPostOrder(userId, id),
      ).rejects.toThrow('Not Found: post order');
    });

    it('should throw ConflictException if publish state is not failed', async () => {
      const userId = 1,
        id =
          '0x8593560768e1f78c465e54ae70585661090e39a523d3b51939c3d962f24af7de9dd37c19c7fab9d50950804886bf95455036353a2c80f46d1d7a079ca0a6b489';
      jest
        .spyOn(postOrdersBaseService, 'getById')
        .mockImplementationOnce(async (id: string) => ({
          id,
          userId,
          submitState: PipelineOrderTaskCommonState.DOING,
          publishState: PipelineOrderTaskCommonState.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          serverVerificationId:
            '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
          certificateStorageType: MetadataStorageType.ARWEAVE,
          certificateId: 'XYyD1wAcUctI8HA1BwL8Sp2BFDHElJ8w6wTlQATcz',
          certificateState: PipelineOrderTaskCommonState.FINISHED,
          postTaskId:
            'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
          publishSiteOrderId: 0,
          publishSiteTaskId: '',
          postMetadata: {
            id,
            title: `测试标题`,
            content: `测试内容`,
            summary: `测试内容`,
            cover: 'https://example.com/test-cover.png',
            categories: '测试分类',
            tags: '测试标签1,测试标签2',
            license: 'CC 4.0',
            digest:
              '0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8',
            authorPublicKey: authorKeys.public,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }));
      expect(
        async () => await service.retryPostOrder(userId, id),
      ).rejects.toThrow(new ConflictException('No retry required'));
    });
  });
});
