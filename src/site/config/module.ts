import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import { SiteInfoModule } from 'src/site/info/module';
import { SiteConfigBaseService } from 'src/site/config/baseService';
import { SiteConfigController } from 'src/site/config/controller';
import { SiteConfigLogicService } from 'src/site/config/logicService';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity]), SiteInfoModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigBaseService, SiteConfigLogicService],
  exports: [SiteConfigLogicService],
})
export class SiteConfigModule {}
