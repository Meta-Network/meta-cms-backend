import { Module } from '@nestjs/common';
import { SiteConfigController } from './controller';
import { SiteConfigService } from './service';

@Module({
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
