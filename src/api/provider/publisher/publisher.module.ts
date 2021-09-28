import { Module } from '@nestjs/common';

import { GitHubPublisherModule } from './github/github.publisher.module';
import { PublisherService } from './publisher.service';

@Module({
  imports: [GitHubPublisherModule],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}
