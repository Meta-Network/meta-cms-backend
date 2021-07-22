import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeORMConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get<string>('db.host'),
      ssl: {
        ca: fs.readFileSync('./rds-ca-2019-root.pem', 'utf8').toString(),
      },
      port: this.configService.get<number>('db.port', 3306),
      connectTimeout: 60 * 60 * 1000,
      username: this.configService.get<string>('db.username'),
      password: this.configService.get<string>('db.password'),
      database: this.configService.get<string>('db.database'),
      autoLoadEntities: true,
      entities: [],
      synchronize: false,
    };
  }
}
