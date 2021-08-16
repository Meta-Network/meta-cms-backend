import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteInfoEntity } from 'src/entities/siteInfo.entity';
import { SiteInfoBaseService } from 'src/api/site/info/baseService';
import { SiteInfoController } from 'src/api/site/info/controller';
import { SiteInfoLogicService } from 'src/api/site/info/logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity])],
  controllers: [SiteInfoController],
  providers: [SiteInfoBaseService, SiteInfoLogicService],
  exports: [SiteInfoLogicService],
})
export class SiteInfoModule {}
