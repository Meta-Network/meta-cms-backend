import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { BullQueueType } from '../../../constants';
import { AppCacheModule } from '../../cache/module';
import { DockerTasksModule } from '../docker/module';
import { HexoWorkerTaskController } from './controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BullQueueType.WORKER_HEXO,
      limiter: { max: 5, duration: 3000, bounceBack: true },
    }),
    DockerTasksModule,
    AppCacheModule,
  ],
  controllers: [HexoWorkerTaskController],
})
export class HexoWorkerTasksModule {}
