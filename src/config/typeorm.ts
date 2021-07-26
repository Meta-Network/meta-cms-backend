import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';

@Injectable()
export class TypeORMConfigService implements TypeOrmOptionsFactory {
  // constructor(private readonly configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const rootOptions = await getConnectionOptions();

    return Object.assign(rootOptions, {
      autoLoadEntities: true,
    });
  }
}
