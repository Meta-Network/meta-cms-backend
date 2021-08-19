import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BullQueueType } from 'src/constants';

import { TasksService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
    }),
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
