import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GitHubPublisherProviderEntity } from '../../../../entities/provider/publisher/github.entity';
import { MetaUCenterModule } from '../../../microservices/meta-ucenter/meta-ucenter.module';
import { SiteConfigModule } from '../../../site/config/module';
import { OctokitService } from '../../octokitService';
import { GitHubPublisherController } from './github.publisher.controller';
import { GitHubPublisherProvider } from './github.publisher.provider';
import { GitHubPublisherService } from './github.publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubPublisherProviderEntity]),
    SiteConfigModule,
    MetaUCenterModule,
  ],
  controllers: [GitHubPublisherController],
  providers: [GitHubPublisherService, GitHubPublisherProvider, OctokitService],
  exports: [GitHubPublisherService],
})
export class GitHubPublisherModule {}
