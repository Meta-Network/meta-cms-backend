import { Module } from '@nestjs/common';

import { SiteConfigModule } from '../../site/config/module';
import { DomainValidateController } from './controller';
import { DomainValidateService } from './service';

@Module({
  imports: [SiteConfigModule],
  controllers: [DomainValidateController],
  providers: [DomainValidateService],
  exports: [DomainValidateService],
})
export class DomainValidateModule {}
