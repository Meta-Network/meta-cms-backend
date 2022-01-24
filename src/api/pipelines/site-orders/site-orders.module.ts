import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import { PostOrdersModule } from '../post-orders/post-orders.module';
import { PostTasksModule } from '../post-tasks/post-tasks.module';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publlish-site-orders.base.service';
import { SiteOrdersController } from './site-orders.controller';
import { SiteOrdersLogicService } from './site-orders.logic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeploySiteOrderEntity, PublishSiteOrderEntity]),
    PostOrdersModule,
    PostTasksModule,
  ],
  controllers: [SiteOrdersController],
  providers: [
    DeploySiteOrdersBaseService,
    PublishSiteOrdersBaseService,
    SiteOrdersLogicService,
  ],
  exports: [
    DeploySiteOrdersBaseService,
    PublishSiteOrdersBaseService,
    SiteOrdersLogicService,
  ],
})
export class SiteOrdersModule {}
