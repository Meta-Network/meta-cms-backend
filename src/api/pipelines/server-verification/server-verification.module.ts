import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServerVerificationEntity } from '../../../entities/pipeline/server-verification.entity';
import { ServerVerificationBaseService } from './server-verification.base.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServerVerificationEntity])],
  providers: [ServerVerificationBaseService],
  exports: [ServerVerificationBaseService],
})
export class ServerVerificationModule {}
