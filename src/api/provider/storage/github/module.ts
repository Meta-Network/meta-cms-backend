import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import { MetaUCenterModule } from '../../../microservices/meta-ucenter/meta-ucenter.module';
import { SiteConfigModule } from '../../../site/config/module';
import { OctokitService } from '../../octokitService';
import { GitHubStorageBaseService } from './baseService';
import { GitHubStorageController } from './controller';
import { GitHubStorageLogicService } from './logicService';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    SiteConfigModule,
    MetaUCenterModule,
  ],
  controllers: [GitHubStorageController],
  providers: [
    GitHubStorageBaseService,
    GitHubStorageLogicService,
    OctokitService,
  ],
  exports: [GitHubStorageLogicService],
})
export class GitHubStorageModule {}
