import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import assert from 'assert';
import { Algorithm } from 'jsonwebtoken';

import { ConfigKeyNotFoundException } from '../../exceptions';
import { isDevelopment } from '../../utils';

@Injectable()
export class CMSJwtConfigService implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('jwt.cms.symmetricKey');
    this.issuer = this.configService.get<string>('jwt.cms.sign.issuer');
    this.audience = this.configService.get<string>('jwt.cms.sign.audience');
    this.expiresIn = this.configService.get<string>('jwt.cms.sign.expiresIn');
    assert(this.secret, new ConfigKeyNotFoundException('jwt.cms.symmetricKey'));
    assert(this.issuer, new ConfigKeyNotFoundException('jwt.cms.sign.issuer'));
    assert(
      this.audience,
      new ConfigKeyNotFoundException('jwt.cms.sign.audience'),
    );
    assert(
      this.expiresIn,
      new ConfigKeyNotFoundException('jwt.cms.sign.expiresIn'),
    );
  }

  private readonly secret: string;
  private readonly algorithm: Algorithm = 'HS512'; // TODO: move to config
  private readonly expiresIn: string;
  private readonly issuer: string;
  private readonly audience: string;

  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      secret: this.secret,
      signOptions: {
        algorithm: this.algorithm,
        expiresIn: this.expiresIn,
        issuer: this.issuer,
        audience: this.audience,
      },
      verifyOptions: {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience,
        ignoreExpiration: isDevelopment(),
      },
    };
  }
}
