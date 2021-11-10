import {
  generateAuthorDigestSignMetadata,
  generateKeys,
  generatePostDigestRequestMetadata,
  generateSeed,
  verifyDigest,
} from '@metaio/meta-signature-util';
import {
  AuthorDigestRequestMetadata,
  KeyPair,
} from '@metaio/meta-signature-util/type/types';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import han from 'han';
import moment from 'moment';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../configs';
import { WinstonConfigService } from '../../configs/winston';
import { ValidationException } from '../../exceptions';
import { MetadataStorageType } from '../../types/enum';
import { PostHelper } from '../post/post.helper';
import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { MetadataStorageService } from '../provider/metadata-storage/metadata-storage.service';
import { MetaSignatureService } from './meta-signature.service';

describe('MetaSignatureService', () => {
  let configService: ConfigService;
  let postHelper: PostHelper;
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
      providers: [MetaSignatureService, PostHelper],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    postHelper = module.get<PostHelper>(PostHelper);
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
    const authorDigestRequestMetadata = generatePostDigestRequestMetadata({
      title: '测试标题',
      categories: '分类一,分类二,test-case',
      content: '测试正文',
      cover:
        'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
      licence: 'CC-BY-4.0',
      summary: '测试摘要',
      tags: '标签一,标签二',
    });
    console.log(authorDigestRequestMetadata);
  });
  describe('verify author digest', () => {
    it('Should return true', async () => {
      const authorDigestRequestMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        type: 'author-digest',
        algorithm: 'sha256',
        version: '2021-11-01-01',
        title: '测试标题',
        categories: '分类一,分类二,test-case',
        content: '测试正文',
        cover:
          'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
        licence: 'CC-BY-4.0',
        summary: '测试摘要',
        tags: '标签一,标签二',
        digest:
          '0x2068f5e16c85b39e3b7848a4b7475291e491f64aef2baf33be92e0f182944b58',
        ts: 1636466942189,
      } as AuthorDigestRequestMetadata;
      expect(verifyDigest(authorDigestRequestMetadata)).toBeTruthy();
    });
    it('Should return false when digest is not correct', async () => {
      const authorDigestRequestMetadata = {
        '@context': 'https://metanetwork.online/ns/cms',
        type: 'author-digest',
        algorithm: 'sha256',
        version: '2021-11-01-01',
        title: '测试标题',
        categories: '分类一,分类二,test-case',
        content: '测试正文',
        cover:
          'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
        licence: 'CC-BY-4.0',
        summary: '测试摘要',
        tags: '标签一,标签二',
        digest:
          '0x2068f5e16c85b39e3b7848a4b7475291e491f64aef2baf33be92e0f182944b59',
        ts: 1636466942189,
      } as AuthorDigestRequestMetadata;
      expect(verifyDigest(authorDigestRequestMetadata)).toBeFalsy();
    });
  });
  it('generateAuthorDigestSign', async () => {
    const authorDigestRequestMetadata = {
      '@context': 'https://metanetwork.online/ns/cms',
      type: 'author-digest',
      algorithm: 'sha256',
      version: '2021-11-01-01',
      title: '测试标题',
      categories: '分类一,分类二,test-case',
      content: '测试正文',
      cover:
        'https://ipfs.fleek.co/ipfs/QmeMcZwDkL1Kkj1zWtYBKQmLBZWS87ekZbJLpeYdobrZp4',
      licence: 'CC-BY-4.0',
      summary: '测试摘要',
      tags: '标签一,标签二',
      digest:
        '0x2068f5e16c85b39e3b7848a4b7475291e491f64aef2baf33be92e0f182944b58',
      ts: 1636466942189,
    } as AuthorDigestRequestMetadata;
    const authorSignatureMetadata = generateAuthorDigestSignMetadata(
      authorKeys,
      'meta-cms.vercel.mttk.net',
      authorDigestRequestMetadata.digest,
    );
    console.log(authorSignatureMetadata);
    const cid = await metadataStorageService.upload(
      MetadataStorageType.IPFS,
      `authorDigestSign/${moment().format('YYYYMMDDHHmmss')}/${han.letter(
        authorSignatureMetadata.signature,
        '-',
      )}`,
      JSON.stringify(authorSignatureMetadata),
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
        type: 'author-digest-sign',
        signatureAlgorithm: 'curve25519',
        version: '2021-11-01-01',
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
  });

  describe('generateAuthorDigestSignWithContentServerVerificationMetadata', () => {
    it('Should return authorDigestSignWithContentServerVerificationMetadata', async () => {
      const authorDigestSignWithContentServerVerificationMetadata =
        await metaSignatureService.generateAuthorDigestSignWithContentServerVerificationMetadata(
          MetadataStorageType.IPFS,
          'bafybeifm62ueruik5omjld6ea4bv42yhz5rahfulm6rsh5nbglavkmkqzu',
          MetadataStorageType.IPFS,
          'bafybeibascslzjqemjt5d3bxnt7hurgbsqfe7tr2lcgy7zi22mlfoap4cq',
        );
      console.log(
        JSON.stringify(authorDigestSignWithContentServerVerificationMetadata),
      );
    });
  });

  describe('generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata', () => {
    it('Should return authorDigestSignWithContentServerVerificationMetadata & refer', async () => {
      const {
        authorDigestSignWithContentServerVerificationMetadataRefer,
        authorDigestSignWithContentServerVerificationMetadata,
      } = await metaSignatureService.generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
        `authorDigestSignWithContentServerVerification/${moment().format(
          'YYYYMMDDHHmmss',
        )}/${han.letter('测试标题', '-')}`,
        MetadataStorageType.IPFS,
        'bafybeifm62ueruik5omjld6ea4bv42yhz5rahfulm6rsh5nbglavkmkqzu',
        MetadataStorageType.IPFS,
        'bafybeibascslzjqemjt5d3bxnt7hurgbsqfe7tr2lcgy7zi22mlfoap4cq',
      );
      console.log(authorDigestSignWithContentServerVerificationMetadataRefer);
      console.log(
        JSON.stringify(authorDigestSignWithContentServerVerificationMetadata),
      );
    });
  });
});
