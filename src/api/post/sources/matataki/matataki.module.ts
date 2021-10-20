import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { MatatakiSourceService } from './matataki-source.service';

@Module({
  imports: [HttpModule],
  providers: [MatatakiSourceService],
  exports: [MatatakiSourceService],
})
export class MatatakiSourceModule {}
