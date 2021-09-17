import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { LoggerService, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerJobProcessorType, TaskWorkerType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { DockerTasksService } from '../docker/service';
import { TaskWorkerJobProcessorDockerImpl } from '../docker/task-worker-job.processor.docker.impl';
import { buildProcessor } from '../task-worker-job.processor-factory';
import { TaskWorkersModule } from '../workers/module';
import { TaskWorkerJobProcessorMockImpl } from '../workers/task-worker-job.processor.mock.impl';
import { GitWorkerTaskController } from './controller';
import { GitWorkersService } from './git-workers.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: TaskWorkerType.WORKER_GIT,
      useFactory: (configService: ConfigService) =>
        configService.get<BullModuleOptions>('task.worker.git.queue'),
      inject: [ConfigService],
    }),
    TaskWorkersModule,
    DockerTasksModule,
    AppCacheModule,
  ],
  controllers: [GitWorkerTaskController],
  providers: [
    GitWorkersService,
    {
      provide: 'TASK_WORKER_JOB_PROCESSOR_GIT',

      useFactory: (
        logger: LoggerService,
        configService: ConfigService,
        dockerTasksService: DockerTasksService,
      ) =>
        buildProcessor(
          TaskWorkerType.WORKER_GIT,
          logger,
          configService,
          dockerTasksService,
        ),

      inject: [WINSTON_MODULE_NEST_PROVIDER, ConfigService, DockerTasksService],
    },
  ],
  exports: [GitWorkersService],
})
export class GitWorkerTasksModule {}
