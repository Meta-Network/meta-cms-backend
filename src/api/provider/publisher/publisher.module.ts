import { Module } from '@nestjs/common';

import { GiteePublisherModule } from './gitee/gitee.publisher.module';
import { GitHubPublisherModule } from './github/github.publisher.module';
import { PublisherService } from './publisher.service';
import { WorkerModel2PublisherService } from './worker-model2.publisher.service';

@Module({
  imports: [GitHubPublisherModule, GiteePublisherModule],
  providers: [PublisherService, WorkerModel2PublisherService],
  exports: [PublisherService, WorkerModel2PublisherService],
})
export class PublisherModule {}
