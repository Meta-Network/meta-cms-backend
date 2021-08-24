import { Module } from '@nestjs/common';

import { DockerTasksModule } from './docker/module';
import { GitWorkerTasksModule } from './git/module';

@Module({
  imports: [GitWorkerTasksModule, DockerTasksModule],
})
export class TasksModule {}
