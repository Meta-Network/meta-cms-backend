import { Module } from '@nestjs/common';

import { AppCacheModule } from '../../../cache/module';
import { TaskDispatchersService } from './task-dispatchers.service';

@Module({
  imports: [AppCacheModule],
  providers: [TaskDispatchersService],
  exports: [TaskDispatchersService],
})
export class TaskWorkersModule {}
