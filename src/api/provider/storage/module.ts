import { Module } from '@nestjs/common';

import { MetaUCenterModule } from '../../microservices/meta-ucenter/meta-ucenter.module';
import { GiteeStorageModule } from './gitee/module';
import { GitHubStorageModule } from './github/module';
import { StorageService } from './service';

@Module({
  imports: [MetaUCenterModule, GitHubStorageModule, GiteeStorageModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
