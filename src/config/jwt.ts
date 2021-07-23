import { PUBLIC_KEYS } from '@meta-network/auth-sdk';
import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';

@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      privateKey: PUBLIC_KEYS.DEVELOPMENT,
    };
  }
}
