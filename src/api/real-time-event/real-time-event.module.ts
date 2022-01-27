import { Module } from '@nestjs/common';

import { UCenterAuthModule } from '../../auth/ucenter/module';
import { PostOrdersModule } from '../pipelines/post-orders/post-orders.module';
import { RealTimeEventGateway } from './real-time-event.gateway';

@Module({
  imports: [UCenterAuthModule, PostOrdersModule],
  providers: [RealTimeEventGateway],
})
export class RealTimeEventModule {}
