import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigEntity } from '../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { SiteConfigController } from './controller';
import { SiteConfigService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteInfoEntity, SiteConfigEntity])],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
