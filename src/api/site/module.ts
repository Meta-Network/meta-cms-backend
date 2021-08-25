import { Module } from '@nestjs/common';

import { ThemeTemplateModule } from '../theme/template/module';
import { SiteConfigModule } from './config/module';
import { SiteInfoModule } from './info/module';
import { SiteService } from './service';

@Module({
  imports: [SiteInfoModule, SiteConfigModule, ThemeTemplateModule],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
