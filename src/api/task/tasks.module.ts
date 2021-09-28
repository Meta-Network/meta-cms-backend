import { Module } from '@nestjs/common';

import { MetaNetworkModule } from '../microservices/meta-network/meta-network.module';
import { DnsModule } from '../provider/dns/dns.module';
import { PublisherModule } from '../provider/publisher/publisher.module';
import { StorageModule } from '../provider/storage/module';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { SiteModule } from '../site/module';
import { DockerProcessorsModule } from './processors/docker/docker-processors.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { GitWorkersModule } from './workers/git/git-workers.module';
import { HexoWorkersModule } from './workers/hexo/hexo-workers.module';
import { TaskWorkersModule } from './workers/task-workers.module';

@Module({
  imports: [
    TaskWorkersModule,
    GitWorkersModule,
    HexoWorkersModule,
    DockerProcessorsModule,
    SiteModule,
    SiteInfoModule,
    SiteConfigModule,
    StorageModule,
    DnsModule,
    PublisherModule,
    MetaNetworkModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
