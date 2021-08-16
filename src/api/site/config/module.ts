import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import { SiteInfoModule } from 'src/api/site/info/module';
import { SiteConfigBaseService } from 'src/api/site/config/baseService';
import { SiteConfigController } from 'src/api/site/config/controller';
import { SiteConfigLogicService } from 'src/api/site/config/logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity]), SiteInfoModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigBaseService, SiteConfigLogicService],
  exports: [SiteConfigLogicService],
})
export class SiteConfigModule {}
