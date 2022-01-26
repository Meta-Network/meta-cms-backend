import { Module } from '@nestjs/common';

import { UCenterAuthModule } from '../../auth/ucenter/module';
import { RealTimeEventGateway } from './real-time-event.gateway';

@Module({
  imports: [UCenterAuthModule],
  providers: [RealTimeEventGateway],
})
export class RealTimeEventModule {}
