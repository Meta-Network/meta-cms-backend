import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import han from 'han';
import moment from 'moment';
import { WinstonModule } from 'nest-winston';

import { configBuilder } from '../../configs';
import { WinstonConfigService } from '../../configs/winston';
import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { PostService } from './post.service';

describe('PostService', () => {
  let configService: ConfigService;
  let postService: PostService;

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
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    postService = new PostService(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  });

  it('should be defined', () => {
    expect(postService).toBeDefined();
  });
});
