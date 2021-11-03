import { Module } from '@nestjs/common';

import { GiteePublisherModule } from './gitee/gitee.publisher.module';
import { GitHubPublisherModule } from './github/github.publisher.module';
import { PublisherService } from './publisher.service';

@Module({
  imports: [GitHubPublisherModule, GiteePublisherModule],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}
