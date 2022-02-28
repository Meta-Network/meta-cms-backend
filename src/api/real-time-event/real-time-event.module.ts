import { Module } from '@nestjs/common';

import { UCenterAuthorizeModule } from '../../auth/ucenter/module';
import { PostOrdersModule } from '../pipelines/post-orders/post-orders.module';
import { RealTimeEventGateway } from './real-time-event.gateway';

@Module({
  imports: [UCenterAuthorizeModule, PostOrdersModule],
  providers: [RealTimeEventGateway],
})
export class RealTimeEventModule {}
