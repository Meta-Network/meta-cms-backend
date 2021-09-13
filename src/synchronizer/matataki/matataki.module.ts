import { Module } from '@nestjs/common';
import { MatatakiService } from './matataki.service';

@Module({
  providers: [MatatakiService]
})
export class MatatakiModule {}
