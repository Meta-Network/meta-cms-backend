import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';

import { UCenterMicroserviceConfigService } from '../../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../../constants';
import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { DraftEntity } from '../../entities/draft.entity';
import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { SiteConfigLogicService } from '../site/config/logicService';
import { SiteConfigModule } from '../site/config/module';
import { TasksModule } from '../task/tasks.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PreprocessorModule } from './preprocessor/preprocessor.module';
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
    TasksModule,
    SiteConfigModule,
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
})
export class PostModule {}
