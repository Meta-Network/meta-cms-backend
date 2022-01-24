import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';
import { PostOrdersModule } from '../post-orders/post-orders.module';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { PostTasksBaseService } from './post-tasks.base.service';
import { PostTasksController } from './post-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostTaskEntity]), PostOrdersModule],
  controllers: [PostTasksController],
  providers: [PostTasksBaseService, PostTasksLogicService],
  exports: [PostTasksBaseService, PostTasksLogicService],
})
export class PostTasksModule {}
