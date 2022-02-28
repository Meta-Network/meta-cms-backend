import { PUBLIC_KEY } from '@metaio/auth-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';

@Injectable()
export class UCenterJwtConfigService implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      publicKey: PUBLIC_KEY,
      verifyOptions: {
        issuer: this.configService.get<string>('jwt.ucenter.verify.issuer'),
        audience: this.configService.get<string>('jwt.ucenter.verify.audience'),
        ignoreExpiration: process.env.NODE_ENV !== 'production',
      },
    };
  }
}