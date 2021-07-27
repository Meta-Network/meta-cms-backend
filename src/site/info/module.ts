import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteInfoEntity } from '../../entities/siteInfo';
import { SiteInfoController } from './controller';
import { SiteInfoService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity])],
  controllers: [SiteInfoController],
  providers: [SiteInfoService],
  exports: [SiteInfoService],
})
export class SiteInfoModule {}
