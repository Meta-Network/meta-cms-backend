import * as fs from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from '../config';
import { SiteConfigModule } from '../site/config/module';
import { SiteInfoModule } from '../site/info/module';
import { AppController } from './controller';
import { AppService } from './service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('db.host'),
        ssl: {
          ca: fs.readFileSync('./rds-ca-2019-root.pem', 'utf8').toString(),
        },
        port: configService.get<number>('db.port', 3306),
        connectTimeout: 60 * 60 * 1000,
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        autoLoadEntities: true,
        entities: [],
        synchronize: false,
      }),
    }),
    SiteInfoModule,
    SiteConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
