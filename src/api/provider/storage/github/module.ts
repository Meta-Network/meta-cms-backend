import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubStorageBaseService } from 'src/api/provider/storage/github/baseService';
import { GitHubStorageController } from 'src/api/provider/storage/github/controller';
import { GitHubStorageLogicService } from 'src/api/provider/storage/github/logicService';
import { SiteConfigModule } from 'src/api/site/config/module';
import { TasksModule } from 'src/api/task/module';
import { ThemeTemplateModule } from 'src/api/theme/template/module';
import { GitHubStorageProviderEntity } from 'src/entities/provider/storage/github.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubStorageProviderEntity]),
    SiteConfigModule,
    ThemeTemplateModule,
    TasksModule,
  ],
  controllers: [GitHubStorageController],
  providers: [GitHubStorageBaseService, GitHubStorageLogicService],
  exports: [GitHubStorageLogicService],
})
export class GitHubStorageModule {}
