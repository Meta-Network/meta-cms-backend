import { Module } from '@nestjs/common';

import { PostOrdersModule } from '../post-orders/post-orders.module';
import { PostTasksModule } from '../post-tasks/post-tasks.module';
import { SiteOrdersModule } from '../site-orders/site-orders.module';
import { DeploySiteTasksBaseService } from '../site-tasks/deploy-site-tasks.base.service';
import { PublishSiteTasksBaseService } from '../site-tasks/publish-site-tasks.base.service';
import { SiteTasksLogicService } from '../site-tasks/site-tasks.logic.service';
import { SiteTasksModule } from '../site-tasks/site-tasks.module';
import { WorkerTasksController } from './worker-tasks.controller';
import { WorkerTasksLogicService } from './worker-tasks.logic.service';

@Module({
  imports: [
    PostOrdersModule,
    PostTasksModule,
    SiteOrdersModule,
    SiteTasksModule,
  ],
  controllers: [WorkerTasksController],
  providers: [WorkerTasksLogicService],
  exports: [WorkerTasksLogicService],
})
export class WorkerTasksModule {}
