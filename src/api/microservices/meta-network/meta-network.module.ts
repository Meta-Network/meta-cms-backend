import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';

import { NetworkMicroserviceConfigService } from '../../../configs/microservices/network';
import { MetaMicroserviceClient } from '../../../constants';
import { MetaNetworkService } from './meta-network.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.Network,
        inject: [ConfigService],
        useClass: NetworkMicroserviceConfigService,
      },
    ]),
  ],
  providers: [MetaNetworkService],
  exports: [MetaNetworkService],
})
export class MetaNetworkModule {}
