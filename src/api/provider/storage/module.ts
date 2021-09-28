import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';

import { UCenterMicroserviceConfigService } from '../../../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../../../constants';
import { UCenterModule } from '../../ucenter/ucenter.module';
import { GitHubStorageModule } from './github/module';
import { StorageService } from './service';

@Module({
  imports: [UCenterModule, GitHubStorageModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
