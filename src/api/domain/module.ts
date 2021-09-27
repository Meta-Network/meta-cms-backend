import { Module } from '@nestjs/common';

import { DomainFindModule } from './find/module';
import { DomainValidateModule } from './validate/module';

@Module({
  imports: [DomainValidateModule, DomainFindModule],
})
export class DomainModule {}
