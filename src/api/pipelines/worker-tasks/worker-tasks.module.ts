import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MetaUCenterModule } from '../../microservices/meta-ucenter/meta-ucenter.module';
import { PublisherModule } from '../../provider/publisher/publisher.module';
import { StorageModule } from '../../provider/storage/module';
import { SiteConfigModule } from '../../site/config/module';
import { SiteModule } from '../../site/module';
import { PostOrdersModule } from '../post-orders/post-orders.module';
import { PostTasksModule } from '../post-tasks/post-tasks.module';
import { SiteOrdersModule } from '../site-orders/site-orders.module';
import { SiteTasksModule } from '../site-tasks/site-tasks.module';
import { DockerProcessorsModule } from './processors/docker/docker-processors.module';
import { MockProcessorsModule } from './processors/mock/mock-processors.module';
import { WORKER_TASKS_JOB_PROCESSOR } from './processors/worker-tasks.job-processor';
import { WorkerTasksConsumerService } from './worker-tasks.consumer.service';
import { WorkerTasksController } from './worker-tasks.controller';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: WORKER_TASKS_JOB_PROCESSOR,
      useFactory: (configService: ConfigService) =>
        configService.get<BullModuleOptions>('pipeline.queue'),
      inject: [ConfigService],
    }),
    PostOrdersModule,
    PostTasksModule,
    SiteOrdersModule,
    SiteTasksModule,
    DockerProcessorsModule,
    MockProcessorsModule,
    SiteConfigModule,
    StorageModule,
    PublisherModule,
    SiteModule,
    MetaUCenterModule,
  ],
  controllers: [WorkerTasksController],
  providers: [WorkerTasksConsumerService, WorkerTasksDispatcherService],
  exports: [WorkerTasksDispatcherService],
})
export class WorkerTasksModule {}
