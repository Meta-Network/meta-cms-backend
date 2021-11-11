import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import { UCenterJWTAuthGuard } from '../../auth/ucenter/guard';
import { UCenterAuthModule } from '../../auth/ucenter/module';
import { configBuilder } from '../../configs';
import { BullConfigService } from '../../configs/bull';
import { TypeORMConfigService } from '../../configs/typeorm';
import { WinstonConfigService } from '../../configs/winston';
import { TransformResponseInterceptor } from '../../interceptors/transform';
import { AppCacheModule } from '../cache/module';
import { DomainModule } from '../domain/module';
import { ImageModule } from '../image/image.module';
import { PostModule } from '../post/post.module';
import { MetadataStorageModule } from '../provider/metadata-storage/metadata-storage.module';
import { PublisherModule } from '../provider/publisher/publisher.module';
import { StorageModule } from '../provider/storage/module';
import { SiteModule } from '../site/module';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';
import { TasksModule } from '../task/tasks.module';
import { ThemeTemplateModule } from '../theme/template/module';
import { TokenModule } from '../token/token.module';

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
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    UCenterAuthModule,
    AppCacheModule,
    ThemeTemplateModule,
    SiteModule,
    StorageModule,
    PublisherModule,
    TasksModule,
    SynchronizerModule,
    PostModule,
    TokenModule,
    DomainModule,
    ImageModule,
    MetadataStorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      inject: [JwtService],
      useClass: UCenterJWTAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
