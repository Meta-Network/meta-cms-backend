import { Module } from '@nestjs/common';

import { StorageModule } from '../provider/storage/module';
import { SiteModule } from '../site/module';
import { TasksController } from './controller';
import { DockerTasksModule } from './docker/module';
import { GitWorkerTasksModule } from './git/module';
import { HexoWorkerTasksModule } from './hexo/module';
import { TasksService } from './service';
import { Tasks2Controller } from './tasks.controller';
import { Tasks2Service } from './tasks.service';
import { TaskWorkersModule } from './wokers/module';

@Module({
  imports: [
    TaskWorkersModule,
    GitWorkerTasksModule,
    HexoWorkerTasksModule,
    DockerTasksModule,
    SiteModule,
    StorageModule,
  ],
  controllers: [Tasks2Controller],
  providers: [Tasks2Service],
  exports: [Tasks2Service],
})
export class TasksModule {}
