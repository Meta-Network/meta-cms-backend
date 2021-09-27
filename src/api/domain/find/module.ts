import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { DomainFindController } from './controller';
import { DomainFindService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity])],
  controllers: [DomainFindController],
  providers: [DomainFindService],
  exports: [DomainFindService],
})
export class DomainFindModule {}
