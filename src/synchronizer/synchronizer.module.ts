import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { UCenterMicroserviceConfigService } from '../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../constants';

import { MatatakiModule } from './matataki/matataki.module';
import { AccessTokenService } from './access-token.service';
import { SynchronizerController } from './synchronizer.controller';
import { AccessTokenEntity } from '../entities/accessToken.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessTokenEntity]),
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
    MatatakiModule,
  ],
  providers: [AccessTokenService],
  controllers: [SynchronizerController]
})
export class SynchronizerModule {}
