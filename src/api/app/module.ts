import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { GitHubStorageModule } from 'src/api/provider/storage/github/module';
import { SiteConfigModule } from 'src/api/site/config/module';
import { SiteInfoModule } from 'src/api/site/info/module';
import { TasksModule } from 'src/api/task/module';
import { ThemeTemplateModule } from 'src/api/theme/template/module';
import { JWTAuthGuard } from 'src/auth/guard';
import { AuthModule } from 'src/auth/module';
import { configBuilder } from 'src/configs';
import { BullConfigService } from 'src/configs/bull';
import { TypeORMConfigService } from 'src/configs/typeorm';
import { WinstonConfigService } from 'src/configs/winston';
import { TransformResponseInterceptor } from 'src/interceptors/transform';

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
    AuthModule,
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
      useClass: JWTAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
