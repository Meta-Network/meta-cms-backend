import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { MetaSignatureModule } from '../meta-signature/meta-signature.module';
import { MetaNetworkModule } from '../microservices/meta-network/meta-network.module';
import { DnsModule } from '../provider/dns/dns.module';
import { PublisherModule } from '../provider/publisher/publisher.module';
import { StorageModule } from '../provider/storage/module';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { SiteModule } from '../site/module';
import { BaseTasksService } from './base.tasks.service';
import { PostTasksService } from './post.tasks.service';
import { SiteTasksService } from './site.tasks.service';
import { TasksController } from './tasks.controller';
import { TaskWorkersModule } from './workers/task-workers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostSiteConfigRelaEntity]),
    TaskWorkersModule,
    // GitWorkersModule,
    // HexoWorkersModule,
    // DockerProcessorsModule,
    SiteModule,
    SiteInfoModule,
    SiteConfigModule,
    StorageModule,
    DnsModule,
    PublisherModule,
    MetaNetworkModule,
    MetaSignatureModule,
  ],
  controllers: [TasksController],
  providers: [BaseTasksService, PostTasksService, SiteTasksService],
  exports: [PostTasksService, SiteTasksService],
})
export class TasksModule {}
