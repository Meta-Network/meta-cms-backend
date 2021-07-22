import { Module } from '@nestjs/common';
import { SiteInfoController } from './controller';
import { SiteInfoService } from './service';

@Module({
  controllers: [SiteInfoController],
  providers: [SiteInfoService],
  exports: [SiteInfoService],
})
export class SiteInfoModule {}
