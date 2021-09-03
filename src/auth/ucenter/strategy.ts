import { PUBLIC_KEYS } from '@meta-network/auth-sdk';
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
      secretOrKey: PUBLIC_KEYS.DEVELOPMENT,
      ignoreExpiration: process.env.NODE_ENV !== 'production',
    });

    const cookieName = configService.get<string>('jwt.cookieName');
  }

  async validate(payload: UCenterJWTPayload) {
    const result = {
      id: payload.sub,
      ...payload,
    };
    return result;
  }
}
