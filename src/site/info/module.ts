import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { SiteInfoBaseService } from './baseService';
import { SiteInfoController } from './controller';
import { SiteInfoLogicService } from './logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity])],
  controllers: [SiteInfoController],
  providers: [SiteInfoBaseService, SiteInfoLogicService],
  exports: [SiteInfoLogicService],
})
export class SiteInfoModule {}
