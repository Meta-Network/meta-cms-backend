import { Module } from '@nestjs/common';

import { MetaUCenterModule } from '../../microservices/meta-ucenter/meta-ucenter.module';
import { GitHubStorageModule } from './github/module';
import { StorageService } from './service';

@Module({
  imports: [MetaUCenterModule, GitHubStorageModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
