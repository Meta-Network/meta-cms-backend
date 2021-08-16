import { WinstonModule } from 'nest-winston';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTAuthGuard } from 'src/auth/guard';
import { AuthModule } from 'src/auth/module';
import config from 'src/configs';
import { TypeORMConfigService } from 'src/configs/typeorm';
import { WinstonConfigService } from 'src/configs/winston';
import { TransformResponseInterceptor } from 'src/interceptors/transform';
import { GitHubStorageModule } from 'src/provider/storage/github/module';
import { SiteConfigModule } from 'src/site/config/module';
import { SiteInfoModule } from 'src/site/info/module';
import { ThemeTemplateModule } from 'src/theme/template/module';

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
