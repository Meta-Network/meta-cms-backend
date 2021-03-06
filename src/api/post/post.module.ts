/* eslint-disable import/no-named-as-default */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';

import { AppCacheModule } from '../../cache/module';
import { UCenterMicroserviceConfigService } from '../../configs/microservices/ucenter';
import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { DraftEntity } from '../../entities/draft.entity';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { MetaMicroserviceClient } from '../../types/enum';
import { MetaSignatureModule } from '../meta-signature/meta-signature.module';
import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { PublisherModule } from '../provider/publisher/publisher.module';
import { StorageModule } from '../provider/storage/module';
import { SiteConfigModule } from '../site/config/module';
import { AccessTokenService } from '../synchronizer/access-token.service';
import { TasksModule } from '../task/tasks.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PreprocessorModule } from './preprocessor/preprocessor.module';
import { EditorModule } from './sources/editor/editor.module';
import { MatatakiSourceModule } from './sources/matataki/matataki.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostSiteConfigRelaEntity,
      AccessTokenEntity,
      DraftEntity,
    ]),
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
    PreprocessorModule,
    MatatakiSourceModule,
    EditorModule,
    TasksModule,
    SiteConfigModule,
    MetadataStorageModule,
    MetaSignatureModule,
    PublisherModule,
    StorageModule,
    AppCacheModule,
    HttpModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    AccessTokenService,
    {
      provide: 'REDIS',
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.get<string>('redis.host'),
          port: +configService.get<number>('redis.port'),
          username: configService.get<string>('redis.user'),
          password: configService.get<string>('redis.pass'),
        }),
      inject: [ConfigService],
    },
  ],
  exports: [PostService],
})
export class PostModule {}
