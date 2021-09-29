import { PUBLIC_KEYS } from '@meta-network/auth-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { join } from 'path';

import { CONFIG_PATH } from '../constants';

/**
 * 身份认证用的 JWT_KEY
 */
export const JWT_KEY = {
  publicKey: readFileSync(join(CONFIG_PATH, 'JWT_PUBLIC_KEY.pub')),
};
@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      publicKey: JWT_KEY.publicKey,
      verifyOptions: {
        issuer: this.configService.get<string>('jwt.verify.issuer'),
        audience: this.configService.get<string>('jwt.verify.audience'),
        ignoreExpiration: process.env.NODE_ENV !== 'production',
      },
    };
  }
}
