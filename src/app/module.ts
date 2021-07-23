import { WinstonModule } from 'nest-winston';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTAuthGuard } from '../auth/guard';
import { AuthModule } from '../auth/module';
import config from '../config';
import { TypeORMConfigService } from '../config/typeorm';
import { WinstonConfigService } from '../config/winston';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { AppController } from './controller';
import { AppService } from './service';
import { JwtService } from '@nestjs/jwt';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      inject: [JwtService],
      useClass: JWTAuthGuard,
    },
  ],
})
export class AppModule {}
