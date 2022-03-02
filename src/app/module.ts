import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import { DomainModule } from '../api/domain/module';
import { ImageModule } from '../api/image/image.module';
import { ManagementModule } from '../api/management/module';
import { PostOrdersModule } from '../api/pipelines/post-orders/post-orders.module';
import { PostTasksModule } from '../api/pipelines/post-tasks/post-tasks.module';
import { SiteOrdersModule } from '../api/pipelines/site-orders/site-orders.module';
import { SiteTasksModule } from '../api/pipelines/site-tasks/site-tasks.module';
import { WorkerTasksModule } from '../api/pipelines/worker-tasks/worker-tasks.module';
import { PostModule } from '../api/post/post.module';
import { MetadataStorageModule } from '../api/provider/metadata-storage/metadata-storage.module';
import { PublisherModule } from '../api/provider/publisher/publisher.module';
import { StorageModule } from '../api/provider/storage/module';
import { RealTimeEventModule } from '../api/real-time-event/real-time-event.module';
import { SiteModule } from '../api/site/module';
import { SynchronizerModule } from '../api/synchronizer/synchronizer.module';
import { ThemeTemplateModule } from '../api/theme/template/module';
import { TokenModule } from '../api/token/token.module';
import { AuthorizeModule } from '../auth/module';
import { UCenterAuthenticationGuard } from '../auth/ucenter/guard';
import { AppCacheModule } from '../cache/module';
import { configBuilder } from '../configs';
import { BullConfigService } from '../configs/bull';
import { TypeORMConfigService } from '../configs/typeorm';
import { WinstonConfigService } from '../configs/winston';
import { EthereumModule } from '../ethereum/module';
import { TransformResponseInterceptor } from '../interceptors/transform';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configBuilder],
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useClass: WinstonConfigService,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: TypeORMConfigService,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useClass: BullConfigService,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthorizeModule,
    AppCacheModule,
    ThemeTemplateModule,
    SiteModule,
    StorageModule,
    PublisherModule,
    SynchronizerModule,
    PostModule,
    TokenModule,
    DomainModule,
    ImageModule,
    MetadataStorageModule,
    PostOrdersModule,
    PostTasksModule,
    SiteOrdersModule,
    SiteTasksModule,
    WorkerTasksModule,
    RealTimeEventModule,
    EthereumModule,
    ManagementModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      inject: [JwtService],
      useClass: UCenterAuthenticationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
