import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { DockerTasksModule } from '../docker/module';
import { GitWorkerTaskController } from './controller';
import { GitWorkerTaskProcessor } from './processor';
import { GitWorkerTaskService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
    }),
    DockerTasksModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [GitWorkerTaskService, GitWorkerTaskProcessor],
  exports: [GitWorkerTaskService],
})
export class GitWorkerTasksModule {}
