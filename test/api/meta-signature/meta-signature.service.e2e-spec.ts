import {
  authorDigest,
  AuthorDigestMetadata,
  authorDigestSign,
  AuthorPostSignatureMetadata,
  authorPublishMetaSpaceRequest,
  generateKeys,
  generateSeed,
  KeyPair,
} from '@metaio/meta-signature-util';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import han from 'han';
import moment from 'moment';
import { WinstonModule } from 'nest-winston';

import { MetaSignatureHelper } from '../../../src/api/meta-signature/meta-signature.helper';
import { MetaSignatureService } from '../../../src/api/meta-signature/meta-signature.service';
import { MetadataStorageModule } from '../../../src/api/provider/metadata-storage/metadata-storage.module';
import { MetadataStorageService } from '../../../src/api/provider/metadata-storage/metadata-storage.service';
import { configBuilder } from '../../../src/configs';
import { WinstonConfigService } from '../../../src/configs/winston';
import { MetadataStorageType } from '../../../src/types/enum';

describe('MetaSignatureService (e2e)', () => {
  let configService: ConfigService;
  let metaSignatureHelper: MetaSignatureHelper;
  let metadataStorageService: MetadataStorageService;
  let metaSignatureService: MetaSignatureService;
  const authorKeys = {
    private:
      '0x90b2110acb0a981f4b6748fd67372c11daaa5f8c2cb8db42beadfd5bfb3b3a4c',
    public:
      '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
  } as KeyPair;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configBuilder],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
        MetadataStorageModule,
      ],
      providers: [MetaSignatureService, MetaSignatureHelper],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    metaSignatureHelper = module.get<MetaSignatureHelper>(MetaSignatureHelper);
    metadataStorageService = module.get<MetadataStorageService>(
      MetadataStorageService,
    );
    metaSignatureService =
      module.get<MetaSignatureService>(MetaSignatureService);
  });

  it('should be defined', () => {
    expect(metaSignatureService).toBeDefined();
  });

  it('genereateKeys', () => {
    const seed = generateSeed();
    expect(seed.length).toBe(16);
    const keys = generateKeys(seed);
    console.log(keys);
    expect(keys.private).not.toBe(keys.public);
  });
  it('generatePostDigestRequestMetadata', () => {
    const authorDigestRequestMetadata = authorDigest.generate({
      title: '测试标题',
      categories: '',
      content: '测试正文',
      cover: '',
      license: '',
      summary: '测试摘要',
      tags: '',
    });
    console.log(authorDigestRequestMetadata);
    expect(authorDigest.verify(authorDigestRequestMetadata)).toBeTruthy();
  });
  describe('verify author digest', () => {
    it('Should return true', async () => {
      const authorDigestRequestMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest',
        '@version': '1.0.0',
        algorithm: 'sha256',
        title: '测试标题',
        categories: '分类一,分类二,test-case',
        content: '测试正文',
        cover:
          'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
        license: 'CC-BY-4.0',
        summary: '测试摘要',
        tags: '标签一,标签二',
        digest:
          '0x97564fdec6d57525ea7de9db908fda5fb0ab4f94908cb02ddd843c2a531a6554',
        ts: 1636553657839,
      } as AuthorDigestMetadata;

      expect(authorDigest.verify(authorDigestRequestMetadata)).toBeTruthy();
      const authorDigestRequestMetadata2 = {
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest',
        '@version': '1.0.0',
        algorithm: 'sha256',
        title: '测试标题',
        categories: '',
        content: '测试正文',
        cover: '',
        license: '',
        summary: '测试摘要',
        tags: '',
        digest:
          '0xea38d768d163acc752b6140b91d2c8899a4bbba8814b5e6f7e6edc75852be480',
        ts: 1636553736703,
      } as AuthorDigestMetadata;
      expect(authorDigest.verify(authorDigestRequestMetadata2)).toBeTruthy();
    });
    it('Should return false when digest is not correct', async () => {
      const authorDigestRequestMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest',
        '@version': '1.0.0',
        algorithm: 'sha256',
        title: '测试标题',
        categories: '分类一,分类二,test-case',
        content: '测试正文',
        cover:
          'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
        license: 'CC-BY-4.0',
        summary: '测试摘要',
        tags: '标签一,标签二',
        digest:
          '0x2068f5e16c85b39e3b7848a4b7475291e491f64aef2baf33be92e0f182944b59',
        ts: 1636466942189,
      } as AuthorDigestMetadata;
      expect(authorDigest.verify(authorDigestRequestMetadata)).toBeFalsy();
    });
    it('test fe sample', async () => {
      const authorDigestRequestMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest',
        '@version': '1.0.0',
        algorithm: 'sha256',
        title: '2021111013',
        cover: '',
        summary: '2021111013\n',
        content: '2021111013\n',
        license: '',
        categories: '',
        tags: '',
        digest:
          '0x854f8851aeb627e2e8791d271ca51cd72fb437b2ea51f79eacd10ad4a3762f9d',
        ts: 1636547944915,
      } as AuthorDigestMetadata;

      expect(authorDigest.verify(authorDigestRequestMetadata)).toBeTruthy();

      const cid = await metadataStorageService.upload(
        MetadataStorageType.IPFS,
        'test-fe-sample',
        JSON.stringify(authorDigestRequestMetadata),
      );
      console.log(cid);
    });
  });
  it('generateAuthorDigestSign', async () => {
    const authorDigestRequestMetadata = {
      '@context': 'https://metanetwork.online/ns/cms',
      '@type': 'author-digest',
      '@version': '1.0.0',
      algorithm: 'sha256',
      title: '2021111013',
      cover: '',
      summary: '2021111013\n',
      content: '2021111013\n',
      license: '',
      categories: '',
      tags: '',
      digest:
        '0x854f8851aeb627e2e8791d271ca51cd72fb437b2ea51f79eacd10ad4a3762f9d',
      ts: 1636547944915,
    } as AuthorDigestMetadata;
    const AuthorPostSignatureMetadata = authorDigestSign.generate(
      authorKeys,
      'meta-cms.vercel.mttk.net',
      authorDigestRequestMetadata.digest,
    );
    const cid = await metadataStorageService.upload(
      MetadataStorageType.IPFS,
      'test-fe-sample-auth-sign',
      JSON.stringify(AuthorPostSignatureMetadata),
    );
    console.log(cid);
  });
  describe('validateAuthorDigestSignatureMetadata', () => {
    it('Should return authorDigestSignatureMetadata', async () => {
      const authorDigestSignatureMetadata =
        await metaSignatureService.validateAuthorDigestSignatureMetadata(
          MetadataStorageType.IPFS,
          'bafybeibascslzjqemjt5d3bxnt7hurgbsqfe7tr2lcgy7zi22mlfoap4cq',
        );
      expect(authorDigestSignatureMetadata).toEqual({
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest-sign',
        '@version': '1.0.0',
        signatureAlgorithm: 'curve25519',
        publicKey:
          '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        digest:
          '0x2068f5e16c85b39e3b7848a4b7475291e491f64aef2baf33be92e0f182944b58',
        nonce: '0xa155c5ac5b9d239c4c19515c',
        claim:
          'I authorize publishing by meta-cms.vercel.mttk.net from this device using key: 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        signature:
          '0x809036e271d32bc411b3f58f8c364f0d41c6536f31fd0c5d27217581ecdaa3f420e1098af06428644c235a034e4a986795e7934e0f151823b404549e3a3f828b',
        ts: 1636529099232,
      });
    });

    it('test fe sample', async () => {
      const authorDigestSignatureMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        '@type': 'author-digest-sign',
        '@version': '1.0.0',
        signatureAlgorithm: 'curve25519',
        publicKey:
          '0x9262ac7152cdf516ad3628781821cc9d2151ff31b80218b4f57ebcf1cb826f4d',
        digest:
          '0x854f8851aeb627e2e8791d271ca51cd72fb437b2ea51f79eacd10ad4a3762f9d',
        nonce: '0x29b2141f18ec97b2e668f164',
        claim:
          'I authorize publishing by metaspace.life from this device using key: 0x9262ac7152cdf516ad3628781821cc9d2151ff31b80218b4f57ebcf1cb826f4d',
        signature:
          '0x4c7d9143356296296b26d44e0f344a931581e0e0fe97d76d60f6d6b8800df42b9ac62c9caac05e19f329e70ce38a5bc11f7a87ff74ebd192936138c542502d04',
        ts: 1636547944916,
      } as AuthorPostSignatureMetadata;
      console.log(authorDigestSign.verify(authorDigestSignatureMetadata));
    });
  });

  describe('generateAuthorDigestSignWithContentServerVerificationMetadata', () => {
    jest.setTimeout(15000);
    it('Should return authorDigestSignWithContentServerVerificationMetadata', async () => {
      const authorDigestSignWithContentServerVerificationMetadata =
        await metaSignatureService.generateAuthorDigestSignWithContentServerVerificationMetadata(
          MetadataStorageType.IPFS,
          'bafybeifxjlpsedmpe37r23ey67dfihui3srr63oxrm4sjknynrapiosxde',
          MetadataStorageType.IPFS,
          'bafybeialibcpmaxh3b5bovovmxd2xhmwkuw7meoikjueapnb3i5ml6542i',
        );
      console.log(
        JSON.stringify(authorDigestSignWithContentServerVerificationMetadata),
      );
    });
  });

  describe('generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata', () => {
    jest.setTimeout(15000);
    it('Should return authorDigestSignWithContentServerVerificationMetadata & refer', async () => {
      const {
        authorDigestSignWithContentServerVerificationMetadataRefer,
        authorDigestSignWithContentServerVerificationMetadata,
      } = await metaSignatureService.generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
        `authorDigestSignWithContentServerVerification/${moment().format(
          'YYYYMMDDHHmmss',
        )}/${han.letter('测试标题', '-')}`,
        MetadataStorageType.IPFS,
        'bafybeifxjlpsedmpe37r23ey67dfihui3srr63oxrm4sjknynrapiosxde',
        MetadataStorageType.IPFS,
        'bafybeialibcpmaxh3b5bovovmxd2xhmwkuw7meoikjueapnb3i5ml6542i',
      );
      console.log(authorDigestSignWithContentServerVerificationMetadataRefer);
      console.log(
        JSON.stringify(authorDigestSignWithContentServerVerificationMetadata),
      );
    });
  });

  describe('authorPublishMetaSpaceRequest.generate', () => {
    it('Should return authorPublishMetaSpaceRequestMetadata', async () => {
      const authorPublishMetaSpaceRequestMetadata =
        await authorPublishMetaSpaceRequest.generate(
          authorKeys,
          'meta-cms.vercel.mttk.net',
        );
      console.log(authorPublishMetaSpaceRequestMetadata);
      expect(authorPublishMetaSpaceRequestMetadata).toBeDefined();
      // const cid = await metadataStorageService.upload(
      //   MetadataStorageType.IPFS,
      //   'authorPublishMetaSpaceRequestSample',
      //   JSON.stringify(authorPublishMetaSpaceRequestMetadata),
      // );
      // console.log(`autorPublishMetaSpaceRequestMetadataRefer: ${cid}`);
    });
  });

  describe('generatePublishMetaSpaceServerVerificationMetadata', () => {
    it('Should return authorPublishMetaSpaceRequestMetadata & authorPublishMetaSpaceServerVerificationMetadata if refer is valid', async () => {
      const {
        authorPublishMetaSpaceRequestMetadata,
        authorPublishMetaSpaceServerVerificationMetadata,
      } = await metaSignatureService.generatePublishMetaSpaceServerVerificationMetadata(
        MetadataStorageType.IPFS,
        'bafybeihwh5bnbf4kkexaftap4udgcrccdukud5elb6t34g4yg3efuc4fzq',
      );
      expect(authorPublishMetaSpaceRequestMetadata).toEqual({
        '@context': 'https://metanetwork.online/ns/cms',
        type: 'author-publish-meta-space-request',
        version: '2021-11-01-01',
        signatureAlgorithm: 'curve25519',

        publicKey:
          '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        nonce: '0x5e55c0ef15c254ea4c35af19',
        claim:
          'I authorize publishing Meta Space by meta-cms.vercel.mttk.net from this device using key: 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        signature:
          '0x39cdd6287680dd3aa4bf2fd30f8b94348d4a2d80420f598ef686cf756be5fc3f73d55752f0b241b89207fdfe7d351af98730f199ee3a161601a2568fb2911c87',
        ts: 1636644718420,
      });
      expect(authorPublishMetaSpaceServerVerificationMetadata).toBeDefined();
    });
  });

  describe('generateAndUploadPublishMetaSpaceServerVerificationMetadata', () => {
    jest.setTimeout(15000);
    it('Should return authorPublishMetaSpaceRequestMetadata & authorPublishMetaSpaceServerVerificationMetadata & authorPublishMetaSpaceServerVerificationMetadataRefer if authorPublishMetaSpaceRequestMetadataRefer is valid', async () => {
      const {
        authorPublishMetaSpaceRequestMetadata,
        authorPublishMetaSpaceServerVerificationMetadata,
        authorPublishMetaSpaceServerVerificationMetadataRefer,
      } = await metaSignatureService.generateAndUploadPublishMetaSpaceServerVerificationMetadata(
        metaSignatureHelper.createPublishMetaSpaceVerificationKey(14, 96),
        MetadataStorageType.IPFS,
        'bafybeihwh5bnbf4kkexaftap4udgcrccdukud5elb6t34g4yg3efuc4fzq',
      );
      expect(authorPublishMetaSpaceRequestMetadata).toEqual({
        '@context': 'https://metanetwork.online/ns/cms',
        type: 'author-publish-meta-space-request',
        version: '2021-11-01-01',
        signatureAlgorithm: 'curve25519',
        publicKey:
          '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        nonce: '0x5e55c0ef15c254ea4c35af19',
        claim:
          'I authorize publishing Meta Space by meta-cms.vercel.mttk.net from this device using key: 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
        signature:
          '0x39cdd6287680dd3aa4bf2fd30f8b94348d4a2d80420f598ef686cf756be5fc3f73d55752f0b241b89207fdfe7d351af98730f199ee3a161601a2568fb2911c87',
        ts: 1636644718420,
      });
      expect(authorPublishMetaSpaceServerVerificationMetadata).toBeDefined();
      console.log(
        JSON.stringify(authorPublishMetaSpaceServerVerificationMetadata),
      );
      console.log(
        `authorPublishMetaSpaceServerVerificationMetadataRefer: ${authorPublishMetaSpaceServerVerificationMetadataRefer}`,
      );
    });
  });
});
