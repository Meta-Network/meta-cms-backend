import { Module } from '@nestjs/common';

import { DockerProcessorsService } from './docker-processors.service';

@Module({
  providers: [DockerProcessorsService],
  exports: [DockerProcessorsService],
})
export class DockerProcessorsModule {}
