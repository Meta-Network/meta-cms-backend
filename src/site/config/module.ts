import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigEntity } from '../../entities/siteConfig.entity';
import { SiteInfoModule } from '../info/module';
import { SiteConfigBaseService } from './baseService';
import { SiteConfigController } from './controller';
import { SiteConfigLogicService } from './logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity]), SiteInfoModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigBaseService, SiteConfigLogicService],
  exports: [SiteConfigLogicService],
})
export class SiteConfigModule {}
