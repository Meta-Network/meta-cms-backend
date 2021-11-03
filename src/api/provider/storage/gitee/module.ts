import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GiteeStorageProviderEntity } from '../../../../entities/provider/storage/gitee.entity';
import { MetaUCenterModule } from '../../../microservices/meta-ucenter/meta-ucenter.module';
import { SiteConfigModule } from '../../../site/config/module';
import { GiteeService } from '../../giteeService';
import { GiteeStorageBaseService } from './baseService';
import { GiteeStorageController } from './controller';
import { GiteeStorageLogicService } from './logicService';

@Module({
  imports: [
    TypeOrmModule.forFeature([GiteeStorageProviderEntity]),
    SiteConfigModule,
    MetaUCenterModule,
  ],
  controllers: [GiteeStorageController],
  providers: [GiteeStorageBaseService, GiteeStorageLogicService, GiteeService],
  exports: [GiteeStorageLogicService],
})
export class GiteeStorageModule {}
