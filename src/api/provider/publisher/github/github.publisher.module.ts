import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GitHubPublisherProviderEntity } from '../../../../entities/provider/publisher/github.entity';
import { SiteConfigModule } from '../../../site/config/module';
import { UCenterModule } from '../../../ucenter/ucenter.module';
import { GitHubPublisherController } from './github.publisher.controller';
import { GitHubPublisherProvider } from './github.publisher.provider';
import { GitHubPublisherService } from './github.publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubPublisherProviderEntity]),
    SiteConfigModule,
    UCenterModule,
  ],
  controllers: [GitHubPublisherController],
  providers: [GitHubPublisherService, GitHubPublisherProvider],
  exports: [GitHubPublisherService],
})
export class GitHubPublisherModule {}
