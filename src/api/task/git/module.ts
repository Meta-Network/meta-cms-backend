import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { TaskWorkersModule } from '../wokers/module';
import { GitWorkerTaskController } from './controller';
import { GitWorkersService } from './git-workers.service';
// import { GitWorkerTaskProcessor } from './processor.ts';
import { GitWorkerTaskService } from './service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_GIT,
      limiter: { max: 5, duration: 3000 },
    }),
    TaskWorkersModule,
    DockerTasksModule,
    AppCacheModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [GitWorkerTaskService, GitWorkersService],
  exports: [GitWorkerTaskService, GitWorkersService],
})
export class GitWorkerTasksModule {}
