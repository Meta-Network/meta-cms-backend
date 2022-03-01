import { PUBLIC_KEY } from '@metaio/auth-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { UCenterJWTPayload } from '../../types';
import { AuthGuardType } from '../../types/enum';
import { isDevelopment } from '../../utils';

@Injectable()
export class UCenterJwtStrategy extends PassportStrategy(
  Strategy,
  AuthGuardType.UCenter,
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => req.cookies[cookieName],
      secretOrKey: PUBLIC_KEY,
      issuer: configService.get<string>('jwt.ucenter.verify.issuer'),
      audience: configService.get<string>('jwt.ucenter.verify.audience'),
      algorithms: ['RS256', 'RS384'], // TODO: move to config
      ignoreExpiration: isDevelopment(),
    });

    const cookieName = this.configService.get<string>('jwt.ucenter.cookieName');
  }

  async validate(payload: UCenterJWTPayload): Promise<UCenterJWTPayload> {
    const result = {
      id: payload.sub,
      ...payload,
    };
    return result;
  }
}
