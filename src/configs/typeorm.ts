import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import rootOptions from '../configs/ormconfig';

@Injectable()
export class TypeORMConfigService implements TypeOrmOptionsFactory {
  // constructor(private readonly configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    // const rootOptions = await getConnectionOptions();

    return Object.assign(rootOptions, {
      autoLoadEntities: true,
    });
  }
}
