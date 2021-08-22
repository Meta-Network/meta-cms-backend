import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { GitHubStorageModule } from '../provider/storage/github/module';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { TasksModule } from '../task/module';
import { ThemeTemplateModule } from '../theme/template/module';

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
    UCenterAuthModule,
    SiteInfoModule,
    SiteConfigModule,
    ThemeTemplateModule,
    GitHubStorageModule,
    TasksModule,
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
