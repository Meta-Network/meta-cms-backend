import { Module } from '@nestjs/common';

import { DockerTasksService } from './service';

@Module({
  providers: [DockerTasksService],
  exports: [DockerTasksService],
})
export class DockerTasksModule {}
