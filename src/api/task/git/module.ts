import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { DockerTasksModule } from '../docker/module';
import { GitWorkerTaskController } from './controller';
import { GitWorkerProcessor } from './processor';
import { GitWorkerTasksService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
    }),
    DockerTasksModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [GitWorkerTasksService, GitWorkerProcessor],
  exports: [GitWorkerTasksService],
})
export class GitWorkerTasksModule {}
