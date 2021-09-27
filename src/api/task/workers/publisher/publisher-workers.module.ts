import { Module } from '@nestjs/common';

import { GithubPublisherProvider } from './provider/github.publisher.provider';
import { PublisherWorkersService } from './publisher-workers.service';

@Module({
  providers: [GithubPublisherProvider, PublisherWorkersService],
  exports: [PublisherWorkersService],
})
export class PublisherWorkersModule {}
