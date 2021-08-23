import { Module } from '@nestjs/common';

import { GitWorkerTasksModule } from './git/module';

@Module({
  imports: [GitWorkerTasksModule],
})
export class TasksModule {}
