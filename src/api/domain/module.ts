import { Module } from '@nestjs/common';

import { DomainValidateModule } from './validate/module';

@Module({
  imports: [DomainValidateModule],
})
export class DomainModule {}
