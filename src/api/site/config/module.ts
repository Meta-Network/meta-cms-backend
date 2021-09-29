import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteConfigBaseService } from '../../site/config/baseService';
import { SiteConfigController } from '../../site/config/controller';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { SiteInfoModule } from '../../site/info/module';
import { SiteConfigMsController } from './ms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity]), SiteInfoModule],
  controllers: [SiteConfigController, SiteConfigMsController],
  providers: [SiteConfigBaseService, SiteConfigLogicService],
  exports: [SiteConfigLogicService],
})
export class SiteConfigModule {}
