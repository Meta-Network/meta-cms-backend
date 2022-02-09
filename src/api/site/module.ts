import { Module } from '@nestjs/common';

import { ThemeTemplateModule } from '../theme/template/module';
import { SiteConfigModule } from './config/module';
import { SiteInfoModule } from './info/module';
import { SiteService } from './service';
import { WorkerModel2SiteService } from './worker-model2.service';

@Module({
  imports: [SiteInfoModule, SiteConfigModule, ThemeTemplateModule],
  providers: [SiteService, WorkerModel2SiteService],
  exports: [SiteService, WorkerModel2SiteService],
})
export class SiteModule {}
