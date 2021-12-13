import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { LoggerService, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerType } from '../../../../types/enum';
import { AppCacheModule } from '../../../cache/module';
import { DockerProcessorsModule } from '../../processors/docker/docker-processors.module';
import { DockerProcessorsService } from '../../processors/docker/docker-processors.service';
import { buildProcessor } from '../../processors/task-steps.job-processor.factory';
import { TaskWorkersModule } from '../task-workers.module';
import { GitWorkersController } from './git-workers.controller';
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
    DockerProcessorsModule,
    AppCacheModule,
  ],
  controllers: [GitWorkersController],
  providers: [
    GitWorkersService,
    {
      provide: 'TASK_WORKER_JOB_PROCESSOR_GIT',

      useFactory: (
        logger: LoggerService,
        configService: ConfigService,
        dockerTasksService: DockerProcessorsService,
      ) =>
        buildProcessor(
          TaskWorkerType.WORKER_GIT,
          logger,
          configService,
          dockerTasksService,
        ),

      inject: [
        WINSTON_MODULE_NEST_PROVIDER,
        ConfigService,
        DockerProcessorsService,
      ],
    },
  ],
  exports: [GitWorkersService],
})
export class GitWorkersModule {}
