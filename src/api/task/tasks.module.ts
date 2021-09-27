import { Module } from '@nestjs/common';

import { StorageModule } from '../provider/storage/module';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { SiteModule } from '../site/module';
import { DockerProcessorsModule } from './processors/docker/docker-processors.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { DnsWorkersModule } from './workers/dns/dns-workers.module';
import { GitWorkersModule } from './workers/git/git-workers.module';
import { HexoWorkersModule } from './workers/hexo/hexo-workers.module';
import { PublisherWorkersModule } from './workers/publisher/publisher-workers.module';
import { TaskWorkersModule } from './workers/task-workers.module';

@Module({
  imports: [
    TaskWorkersModule,
    GitWorkersModule,
    HexoWorkersModule,
    PublisherWorkersModule,
    DnsWorkersModule,
    DockerProcessorsModule,
    SiteModule,
    SiteInfoModule,
    SiteConfigModule,
    StorageModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
