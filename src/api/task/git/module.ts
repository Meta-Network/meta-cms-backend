import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';

import { UCenterMicroserviceConfigService } from '../../../configs/microservices/ucenter';
import { BullQueueType, MetaMicroserviceClient } from '../../../constants';
import { SiteConfigModule } from '../../site/config/module';
import { ThemeTemplateModule } from '../../theme/template/module';
import { DockerTasksModule } from '../docker/module';
import { GitWorkerTaskController } from './controller';
import { GitWorkerProcessor } from './processor';
import { GitWorkerTasksService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
    }),
    ClientsModule.registerAsync([
      {
        name: MetaMicroserviceClient.UCenter,
        inject: [ConfigService],
        useClass: UCenterMicroserviceConfigService,
      },
    ]),
    SiteConfigModule,
    ThemeTemplateModule,
    DockerTasksModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [GitWorkerTasksService, GitWorkerProcessor],
  exports: [GitWorkerTasksService],
})
export class GitWorkerTasksModule {}
