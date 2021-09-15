import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { DomainValidateController } from './controller';
import { DomainValidateService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity])],
  controllers: [DomainValidateController],
  providers: [DomainValidateService],
  exports: [DomainValidateService],
})
export class DomainValidateModule {}
