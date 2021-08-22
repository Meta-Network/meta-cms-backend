import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { SiteInfoBaseService } from '../../site/info/baseService';
import { SiteInfoController } from '../../site/info/controller';
import { SiteInfoLogicService } from '../../site/info/logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity])],
  controllers: [SiteInfoController],
  providers: [SiteInfoBaseService, SiteInfoLogicService],
  exports: [SiteInfoLogicService],
})
export class SiteInfoModule {}
