import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from 'src/entities/provider/storage/github.entity';
import { SiteConfigModule } from 'src/api/site/config/module';
import { GitHubStorageBaseService } from 'src/api/provider/storage/github/baseService';
import { GitHubStorageController } from 'src/api/provider/storage/github/controller';
import { GitHubStorageLogicService } from 'src/api/provider/storage/github/logicService';

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
