import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { TaskWorkersModule } from '../wokers/module';
import { HexoWorkerTaskController } from './controller';
import { HexoWorkersService } from './hexo-workers.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_HEXO,
      limiter: { max: 5, duration: 3000 },
    }),
    TaskWorkersModule,
    DockerTasksModule,
    AppCacheModule,
  ],
  controllers: [HexoWorkerTaskController],
  providers: [HexoWorkersService],
  exports: [HexoWorkersService],
})
export class HexoWorkerTasksModule {}
