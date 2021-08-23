import { Module } from '@nestjs/common';

import { GitHubStorageModule } from './github/module';

@Module({
  imports: [GitHubStorageModule],
})
export class StorageModule {}
