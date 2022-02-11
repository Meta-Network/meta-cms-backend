import { Module } from '@nestjs/common';

import { MockProcessorsService } from './mock-processors.service';

@Module({
  providers: [MockProcessorsService],
  exports: [MockProcessorsService],
})
export class MockProcessorsModule {}
