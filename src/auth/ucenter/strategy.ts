import { PUBLIC_KEY } from '@metaio/auth-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { UCenterJWTPayload } from '../../types';

@Injectable()
export class UCenterJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => req.cookies[cookieName],
      secretOrKey: PUBLIC_KEY,
      ignoreExpiration: process.env.NODE_ENV !== 'production',
    });

    const cookieName = this.configService.get<string>('jwt.ucenter.cookieName');
  }

  async validate(payload: UCenterJWTPayload) {
    const result = {
      id: payload.sub,
      ...payload,
    };
    return result;
  }
}
