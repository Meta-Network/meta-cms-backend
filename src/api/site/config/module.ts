import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigBaseService } from 'src/api/site/config/baseService';
import { SiteConfigController } from 'src/api/site/config/controller';
import { SiteConfigLogicService } from 'src/api/site/config/logicService';
import { SiteInfoModule } from 'src/api/site/info/module';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity]), SiteInfoModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigBaseService, SiteConfigLogicService],
  exports: [SiteConfigLogicService],
})
export class SiteConfigModule {}
