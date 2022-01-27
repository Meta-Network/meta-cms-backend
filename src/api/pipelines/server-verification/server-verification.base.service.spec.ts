import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import {
  Connection,
  createConnection,
  getRepository,
  Repository,
} from 'typeorm';

import { WinstonConfigService } from '../../../configs/winston';
import { ServerVerificationEntity } from '../../../entities/pipeline/server-verification.entity';
import { ServerVerificationBaseService } from './server-verification.base.service';

describe('ServerVerificationBaseService', () => {
  let configService: ConfigService;
  let repo: Repository<ServerVerificationEntity>;
  const testConnectionName = 'testConn';
  let service: ServerVerificationBaseService;

  beforeEach(async () => {
    const connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [ServerVerificationEntity],
      synchronize: true,
      logging: false,
      name: testConnectionName,
    });
    repo = getRepository(ServerVerificationEntity, testConnectionName);
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                name: 'meta-cms-test',
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
          provide: Connection,
          useFactory: () => connection,
        },
        {
          provide: getRepositoryToken(ServerVerificationEntity),
          useFactory: () => repo,
        },
        ServerVerificationBaseService,
      ],
    }).compile();

    service = module.get<ServerVerificationBaseService>(
      ServerVerificationBaseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should return server verification entity', async () => {
      const id =
          '0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b',
        payload = `{"@context":"https://metanetwork.online/ns/cms","@type":"server-verification-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f","nonce":"0x426c1e9fd00c32945829bd2c","claim":"I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.","signature":"0xa465b76c21b954f8b9b83f9225c943e0ff1c39f74c8af81ff0078421f56284d5ba4f848cdc1b7ea3aa5286567637943bedb0d7f18799a426c9668b08b927210b","ts":1643268895159,"reference":[{"refer":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","rel":"content","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-post-digest","@version":"1.1.0","algorithm":"sha256","title":"测试标题","content":"测试内容","summary":"测试内容","cover":"https://example.com/test-cover.png","categories":"测试分类","tags":"测试标签1,测试标签2","license":"CC 4.0","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","ts":1643268894887}},{"refer":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","rel":"request","body":{"@context":"https://metanetwork.online/ns/cms","@type":"author-digest-sign","@version":"2.0.0","signatureAlgorithm":"curve25519","publicKey":"0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e","digest":"0x795058a8e0f3add1ae6f79ad3934b83dfa49e24910c08b34eb62abc98a4aefd8","nonce":"0xdb1e21433e00f3ea8e86eeb6","claim":"I signed with my key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e from this device: I authorize meta-cms.mttk.net to publish this post and upload its metadata for notarization.","signature":"0x549df444c72ca308f0c3db1b47757207bf1d50262c226f98cbff968a6e0ce3d644b4c7e2c259f64db0fa5046bbfab86711207b9f51e748ec72c98985ecc70e8f","ts":1643268894887}}]}`;
      const serverVerificationEntity = await service.save(id, payload);
      expect(serverVerificationEntity).toBeDefined();
      expect(serverVerificationEntity.id).toEqual(id);
      expect(serverVerificationEntity.payload).toEqual(payload);
    });
  });
});
