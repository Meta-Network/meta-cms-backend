import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import { GitHubStorageBaseService } from '../../../provider/storage/github/baseService';
import { GitHubStorageController } from '../../../provider/storage/github/controller';
import { GitHubStorageLogicService } from '../../../provider/storage/github/logicService';
import { SiteConfigModule } from '../../../site/config/module';
import { OctokitService } from '../../octokitService';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    SiteConfigModule,
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
