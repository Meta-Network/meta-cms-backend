import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';
import { PublishSiteTaskEntity } from '../../../entities/pipeline/publish-site-task.entity';
import { DnsModule } from '../../provider/dns/dns.module';
import { PublisherModule } from '../../provider/publisher/publisher.module';
import { StorageModule } from '../../provider/storage/module';
import { SiteConfigModule } from '../../site/config/module';
import { SiteModule } from '../../site/module';
import { PostOrdersModule } from '../post-orders/post-orders.module';
import { PostTasksModule } from '../post-tasks/post-tasks.module';
import { SiteOrdersModule } from '../site-orders/site-orders.module';
import { DeploySiteTasksBaseService } from './deploy-site-tasks.base.service';
import { PublishSiteTasksBaseService } from './publish-site-tasks.base.service';
import { SiteTasksController } from './site-tasks.controller';
import { SiteTasksLogicService } from './site-tasks.logic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeploySiteTaskEntity, PublishSiteTaskEntity]),
    PostOrdersModule,
    PostTasksModule,
    SiteOrdersModule,
    SiteConfigModule,
    StorageModule,
    PublisherModule,
    SiteModule,
    DnsModule,
  ],
  controllers: [SiteTasksController],
  providers: [
    DeploySiteTasksBaseService,
    PublishSiteTasksBaseService,
    SiteTasksLogicService,
  ],
  exports: [
    DeploySiteTasksBaseService,
    PublishSiteTasksBaseService,
    SiteTasksLogicService,
  ],
})
export class SiteTasksModule {}
