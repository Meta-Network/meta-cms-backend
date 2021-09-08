import { Module } from '@nestjs/common';

import { StorageModule } from '../provider/storage/module';
import { SiteModule } from '../site/module';
import { TasksController } from './controller';
import { DockerTasksModule } from './docker/module';
import { GitWorkerTasksModule } from './git/module';
import { HexoWorkerTasksModule } from './hexo/module';
import { TasksService } from './service';

@Module({
  imports: [
    GitWorkerTasksModule,
    HexoWorkerTasksModule,
    DockerTasksModule,
    SiteModule,
    StorageModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
