import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostOrdersBaseService } from './post-orders.base.service';
import { PostOrdersController } from './post-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostOrderEntity, PostMetadataEntity])],
  controllers: [PostOrdersController],
  providers: [PostOrdersBaseService, PostOrdersLogicService],
  exports: [PostOrdersBaseService, PostOrdersLogicService],
})
export class PostOrdersModule {}
