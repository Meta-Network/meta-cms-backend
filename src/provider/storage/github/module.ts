import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from 'src/entities/provider/storage/github.entity';
import { SiteConfigModule } from 'src/site/config/module';
import { GitHubStorageBaseService } from 'src/provider/storage/github/baseService';
import { GitHubStorageController } from 'src/provider/storage/github/controller';
import { GitHubStorageLogicService } from 'src/provider/storage/github/logicService';

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
