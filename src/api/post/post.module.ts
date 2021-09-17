import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UCenterMicroserviceConfigService } from '../../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../../constants';
import { AccessTokenEntity } from '../../entities/accessToken.entity';
import { PostEntity } from '../../entities/post.entity';
import { AccessTokenService } from '../../synchronizer/access-token.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, AccessTokenEntity]),
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, AccessTokenService],
})
export class PostModule {}
