import { Module } from '@nestjs/common';

import { GiteeStorageModule } from './gitee/module';
import { GitHubStorageModule } from './github/module';
import { StorageService } from './service';

@Module({
  imports: [GitHubStorageModule, GiteeStorageModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
