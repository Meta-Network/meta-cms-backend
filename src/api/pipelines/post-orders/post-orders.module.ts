import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { MetaSignatureModule } from '../../meta-signature/meta-signature.module';
import { MetadataStorageModule } from '../../provider/metadata-storage/metadata-storage.module';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { ServerVerificationModule } from '../server-verification/server-verification.module';
import { PostOrdersBaseService } from './post-orders.base.service';
import { PostOrdersController } from './post-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostOrderEntity, PostMetadataEntity]),
    MetaSignatureModule,
    MetadataStorageModule,
    ServerVerificationModule,
  ],
  controllers: [PostOrdersController],
  providers: [PostOrdersBaseService, PostOrdersLogicService],
  exports: [PostOrdersBaseService, PostOrdersLogicService],
})
export class PostOrdersModule {}
