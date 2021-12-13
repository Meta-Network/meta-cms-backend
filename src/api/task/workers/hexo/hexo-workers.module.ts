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
import { HexoWorkersController } from './hexo-workers.controller';
import { HexoWorkersService } from './hexo-workers.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: TaskWorkerType.WORKER_HEXO,
      useFactory: (configService: ConfigService) =>
        configService.get<BullModuleOptions>('task.worker.hexo.queue'),
      inject: [ConfigService],
    }),
    TaskWorkersModule,
    DockerProcessorsModule,
    AppCacheModule,
  ],
  controllers: [HexoWorkersController],
  providers: [
    HexoWorkersService,
    {
      provide: 'TASK_WORKER_JOB_PROCESSOR_HEXO',

      useFactory: (
        logger: LoggerService,
        configService: ConfigService,
        dockerTasksService: DockerProcessorsService,
      ) =>
        buildProcessor(
          TaskWorkerType.WORKER_HEXO,
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
  exports: [HexoWorkersService],
})
export class HexoWorkersModule {}
