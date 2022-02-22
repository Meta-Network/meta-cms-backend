import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { PostModule } from '../../post/post.module';
import { MigratePostOrderController } from './postOrder.controller';
import { MigratePostOrderService } from './postOrder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostOrderEntity,
      PostMetadataEntity,
      SiteInfoEntity,
      SiteConfigEntity,
    ]),
    PostModule,
  ],
  controllers: [MigratePostOrderController],
  providers: [MigratePostOrderService],
})
export class MigratePostOrderModule {}
