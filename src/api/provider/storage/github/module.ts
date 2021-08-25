import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UCenterMicroserviceConfigService } from '../../../../configs/microservices/ucenter';
import { MetaMicroserviceClient } from '../../../../constants';
import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import { GitHubStorageBaseService } from '../../../provider/storage/github/baseService';
import { GitHubStorageController } from '../../../provider/storage/github/controller';
import { GitHubStorageLogicService } from '../../../provider/storage/github/logicService';
import { SiteConfigModule } from '../../../site/config/module';
import { SiteModule } from '../../../site/module';
import { GitWorkerTasksModule } from '../../../task/git/module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
    SiteConfigModule,
    SiteModule,
    GitWorkerTasksModule,
  ],
  controllers: [GitHubStorageController],
  providers: [GitHubStorageBaseService, GitHubStorageLogicService],
  exports: [GitHubStorageLogicService],
})
export class GitHubStorageModule {}
