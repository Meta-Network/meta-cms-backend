import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../constants';
import { SiteConfigModule } from '../site/config/module';
import { ThemeTemplateModule } from '../theme/template/module';
import { TaskController } from './controller';
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
  controllers: [TaskController],
  providers: [TasksService, GitWorkerProcessor],
  exports: [TasksService],
})
export class TasksModule {}
