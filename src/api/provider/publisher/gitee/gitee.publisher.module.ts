import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GiteePublisherProviderEntity } from '../../../../entities/provider/publisher/gitee.entity';
import { MetaUCenterModule } from '../../../microservices/meta-ucenter/meta-ucenter.module';
import { SiteConfigModule } from '../../../site/config/module';
import { GiteeService } from '../../giteeService';
import { GiteePublisherBaseService } from './gitee.publisher.base.service';
import { GiteePublisherController } from './gitee.publisher.controller';
import { GiteePublisherLogicService } from './gitee.publisher.logic.service';
import { GiteePublisherProvider } from './gitee.publisher.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([GiteePublisherProviderEntity]),
    SiteConfigModule,
    MetaUCenterModule,
  ],
  controllers: [GiteePublisherController],
  providers: [
    GiteePublisherBaseService,
    GiteePublisherLogicService,
    GiteePublisherProvider,
    GiteeService,
  ],
  exports: [GiteePublisherLogicService],
})
export class GiteePublisherModule {}
