import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';

import { UCenterMicroserviceConfigService } from '../../../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../../../constants';
import { MetaUCenterService } from './meta-ucenter.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
  ],
  providers: [MetaUCenterService],
  exports: [MetaUCenterService],
})
export class MetaUCenterModule {}
