import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { GitWorkerTaskController } from './controller';
import { GitWorkerTaskProcessor } from './processor';
import { GitWorkerTaskService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
      limiter: { max: 5, duration: 3000, bounceBack: true },
    }),
    DockerTasksModule,
    AppCacheModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [GitWorkerTaskService, GitWorkerTaskProcessor],
  exports: [GitWorkerTaskService],
})
export class GitWorkerTasksModule {}
