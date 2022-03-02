import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionAuthorizationModule } from '../../../auth/action/module';
import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { PostModule } from '../../post/post.module';
import { MetadataStorageModule } from '../../provider/metadata-storage/metadata-storage.module';
import { MIGRATE_POST_ORDER_QUEUE } from './postOrder.constants';
import { MigratePostOrderController } from './postOrder.controller';
import { MigratePostOrderProcessor } from './postOrder.processor';
import { MigratePostOrderService } from './postOrder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostOrderEntity,
      PostMetadataEntity,
      SiteInfoEntity,
      SiteConfigEntity,
    ]),
    BullModule.registerQueueAsync({
      name: MIGRATE_POST_ORDER_QUEUE,
    }),
    PostModule,
    MetadataStorageModule,
    ActionAuthorizationModule,
  ],
  controllers: [MigratePostOrderController],
  providers: [MigratePostOrderService, MigratePostOrderProcessor],
})
export class MigratePostOrderModule {}
