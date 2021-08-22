import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BullQueueType } from 'src/constants';

import { SiteConfigModule } from '../site/config/module';
import { ThemeTemplateModule } from '../theme/template/module';
import { GitWorkerProcessor } from './processor';
import { TasksService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
    }),
    SiteConfigModule,
    ThemeTemplateModule,
  ],
  providers: [TasksService, GitWorkerProcessor],
  exports: [TasksService],
})
export class TasksModule {}
