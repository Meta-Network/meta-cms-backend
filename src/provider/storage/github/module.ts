import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';
import { SiteConfigModule } from '../../../site/config/module';
import { GitHubStorageBaseService } from './baseService';
import { GitHubStorageController } from './controller';
import { GitHubStorageLogicService } from './logicService';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    SiteConfigModule,
  ],
  controllers: [GitHubStorageController],
  providers: [GitHubStorageBaseService, GitHubStorageLogicService],
  exports: [GitHubStorageLogicService],
})
export class GitHubStorageModule {}
