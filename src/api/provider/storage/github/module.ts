import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import { GitHubStorageBaseService } from '../../../provider/storage/github/baseService';
import { GitHubStorageController } from '../../../provider/storage/github/controller';
import { GitHubStorageLogicService } from '../../../provider/storage/github/logicService';
import { SiteConfigModule } from '../../../site/config/module';
import { TasksModule } from '../../../task/module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    SiteConfigModule,
    TasksModule,
  ],
  controllers: [GitHubStorageController],
  providers: [GitHubStorageBaseService, GitHubStorageLogicService],
  exports: [GitHubStorageLogicService],
})
export class GitHubStorageModule {}
