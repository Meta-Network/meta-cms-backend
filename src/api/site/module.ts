import { Module } from '@nestjs/common';

import { SiteConfigModule } from './config/module';
import { SiteInfoModule } from './info/module';

@Module({
  imports: [SiteInfoModule, SiteConfigModule],
})
export class SiteModule {}
