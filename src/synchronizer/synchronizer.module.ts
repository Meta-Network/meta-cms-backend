import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UCenterMicroserviceConfigService } from '../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../constants';
import { AccessTokenEntity } from '../entities/accessToken.entity';
import { AccessTokenService } from './access-token.service';
import { MatatakiModule } from './matataki/matataki.module';
import { SynchronizerController } from './synchronizer.controller';

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
  controllers: [SynchronizerController],
})
export class SynchronizerModule {}
