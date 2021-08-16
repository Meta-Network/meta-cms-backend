import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteInfoBaseService } from 'src/api/site/info/baseService';
import { SiteInfoController } from 'src/api/site/info/controller';
import { SiteInfoLogicService } from 'src/api/site/info/logicService';
import { SiteInfoEntity } from 'src/entities/siteInfo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity])],
  controllers: [SiteInfoController],
  providers: [SiteInfoBaseService, SiteInfoLogicService],
  exports: [SiteInfoLogicService],
})
export class SiteInfoModule {}
