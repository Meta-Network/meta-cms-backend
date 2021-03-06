import {
  authorPostDigest,
  authorPostDigestSign,
  KeyPair,
} from '@metaio/meta-signature-util-v2';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import {
  Connection,
  createConnection,
  getConnection,
  getRepository,
  Repository,
} from 'typeorm';

import { WinstonConfigService } from '../../../configs/winston';
import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
import { PostOrdersBaseService } from './post-orders.base.service';

describe('PostOrdersBaseService', () => {
  let configService: ConfigService;
  let repo: Repository<PostOrderEntity>;
  let postMetadataRepo: Repository<PostMetadataEntity>;
  let service: PostOrdersBaseService;
  const testConnectionName = 'testConn';

  const authorKeys = {
    private:
      '0x90b2110acb0a981f4b6748fd67372c11daaa5f8c2cb8db42beadfd5bfb3b3a4c',
    public:
      '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
  } as KeyPair;
  // const serverKeys = {
  //   private:
  //     '0x20db0762690fa66a1534de672822c65c71b9be027b2962e3560cb0238d89a073',
  //   public:
  //     '0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f',
  // };
  beforeEach(async () => {
    const connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [PostOrderEntity, PostMetadataEntity],
      synchronize: true,
      logging: false,
      name: testConnectionName,
    });
    repo = getRepository(PostOrderEntity, testConnectionName);
    postMetadataRepo = getRepository(PostMetadataEntity, testConnectionName);

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
          provide: getRepositoryToken(PostOrderEntity),
          useFactory: () => repo,
        },
        {
          provide: getRepositoryToken(PostMetadataEntity),
          useFactory: () => postMetadataRepo,
        },
        PostOrdersBaseService,
      ],
    }).compile();
    configService = module.get<ConfigService>(ConfigService);

    service = module.get<PostOrdersBaseService>(PostOrdersBaseService);
    return connection;
  });

  afterEach(async () => {
    await getConnection(testConnectionName).close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('paginate', () => {
    it('should return a page with empty items array if no post order exists', async () => {
      const options = {
        page: 2,
        limit: 2,
        route: '/v1/pipelines/post-orders',
      };
      const page = await service.pagi(options, {
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(page).toBeDefined();
      expect(page?.items?.length).toBe(0);
      expect(page?.meta?.totalItems).toBe(0);
      expect(page?.meta?.itemCount).toBe(0);
      expect(page?.meta?.itemsPerPage).toBe(2);
      expect(page?.meta?.totalPages).toBe(0);
      expect(page?.links?.first).toBe(
        `${options.route}?limit=${options.limit}`,
      );
    });

    it('should return a page ', async () => {
      const postMetadatas = [] as PostMetadataEntity[],
        postOrders = [] as Partial<PostOrderEntity>[];
      for (let i = 0; i < 10; i++) {
        const digest = authorPostDigest.generate({
          title: `????????????${i}`,
          content: `????????????${i}`,
          summary: `????????????${i}`,
          cover: '',
          categories: '',
          tags: '',
          license: '',
        });
        const sign = authorPostDigestSign.generate(
          authorKeys,
          'meta-cms.mttk.net',
          digest.digest,
        );
        const postMetadata = {
          id: sign.signature,
          ...digest,
          authorPublicKey: authorKeys.public,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        postMetadatas.push(postMetadata);
        postOrders.push({
          id: sign.signature,
          userId: 1,

          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      // console.log(postOrders);
      await postMetadataRepo.save(postMetadatas);
      await repo.save(postOrders);
      // console.log(await repo.find());
      const options = {
        page: 2,
        limit: 2,
        route: '/v1/pipelines/post-orders',
      };
      const page = await service.pagi(options, {
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
        relations: ['postMetadata'],
      });
      // console.log(page.items[0].postMetadata.title);
      expect(page).toBeDefined();
      expect(page?.items?.length).toBe(2);
      expect(page?.items[0]?.id).toEqual(postOrders[7].id);
      expect(page?.items[0]?.postMetadata?.title).toEqual(
        postMetadatas[7].title,
      );
      expect(page?.items[1]?.id).toEqual(postOrders[6].id);

      expect(page?.meta).toEqual({
        totalItems: 10,
        itemCount: 2,
        itemsPerPage: 2,
        totalPages: 5,
        currentPage: 2,
      });

      expect(page?.links).toEqual({
        first: `${options.route}?limit=${options.limit}`,
        previous: `${options.route}?page=${options.page - 1}&limit=${
          options.limit
        }`,
        next: `${options.route}?page=${options.page + 1}&limit=${
          options.limit
        }`,
        last: `${options.route}?page=5&limit=${options.limit}`,
      });
    });
  });

  describe('save', () => {
    it('should store postOrderEntity & postMetadataEntity', async () => {
      const digest = authorPostDigest.generate({
        title: `????????????`,
        content: `????????????`,
        summary: `????????????`,
        cover: 'https://example.com/test-cover.png',
        categories: '????????????',
        tags: '????????????1,????????????2',
        license: 'CC 4.0',
      });
      const sign = authorPostDigestSign.generate(
        authorKeys,
        'meta-cms.mttk.net',
        digest.digest,
      );
      const postMetadata = {
        id: sign.signature,
        ...digest,
        authorPublicKey: authorKeys.public,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const postOrder = {
        id: sign.signature,
        userId: 1,
        postMetadata,
        submitState: PipelineOrderTaskCommonState.PENDING,
        publishState: PipelineOrderTaskCommonState.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const postOrderEntity = await service.save(postOrder);
      // console.log(postOrderEntity);
      expect(postOrderEntity).toEqual(postOrder);
      const postOrderEntityById = await repo.findOne(postOrder.id, {
        relations: ['postMetadata'],
      });
      // console.log('postOrderEntityById', postOrderEntityById);
      expect(postOrderEntityById.id).toBe(postOrder.id);
      expect(postOrderEntityById.userId).toBe(postOrder.userId);
      expect(postOrderEntityById.submitState).toBe(postOrder.submitState);
      expect(postOrderEntityById.publishState).toBe(postOrder.publishState);
      expect(postOrderEntityById.postMetadata.id).toBe(postOrderEntityById.id);
      expect(postOrderEntityById.postMetadata.title).toEqual(
        postMetadata.title,
      );
      expect(postOrderEntityById.postMetadata.content).toEqual(
        postMetadata.content,
      );
      expect(postOrderEntityById.postMetadata.content).toEqual('????????????');
    });
  });
});
