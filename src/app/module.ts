import { WinstonModule } from 'nest-winston';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTAuthGuard } from '../auth/guard';
import { AuthModule } from '../auth/module';
import config from '../configs';
import { TypeORMConfigService } from '../configs/typeorm';
import { WinstonConfigService } from '../configs/winston';
import { TransformResponseInterceptor } from '../interceptors/transform';
import { GitHubStorageModule } from '../provider/storage/github/module';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { ThemeTemplateModule } from '../theme/template/module';
import { AppController } from './controller';
import { AppService } from './service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useClass: WinstonConfigService,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: TypeORMConfigService,
    }),
    AuthModule,
    SiteInfoModule,
    SiteConfigModule,
    ThemeTemplateModule,
    GitHubStorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
