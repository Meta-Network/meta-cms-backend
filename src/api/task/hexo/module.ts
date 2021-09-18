import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { LoggerService, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { DockerTasksService } from '../docker/service';
import { buildProcessor } from '../task-worker-job.processor-factory';
import { TaskWorkersModule } from '../workers/module';
import { HexoWorkersController } from './controller';
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
    DockerTasksModule,
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
        dockerTasksService: DockerTasksService,
      ) =>
        buildProcessor(
          TaskWorkerType.WORKER_HEXO,
          logger,
          configService,
          dockerTasksService,
        ),
      inject: [WINSTON_MODULE_NEST_PROVIDER, ConfigService, DockerTasksService],
    },
  ],
  exports: [HexoWorkersService],
})
export class HexoWorkerTasksModule {}
