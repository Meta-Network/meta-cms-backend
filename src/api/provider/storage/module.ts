import { Module } from '@nestjs/common';

import { GiteeStorageModule } from './gitee/module';
import { GitHubStorageModule } from './github/module';
import { StorageService } from './service';
import { WorkerModel2StorageService } from './worker-model2.service';

@Module({
  imports: [GitHubStorageModule, GiteeStorageModule],
  providers: [StorageService, WorkerModel2StorageService],
  exports: [StorageService, WorkerModel2StorageService],
})
export class StorageModule {}
