import { PUBLIC_KEYS } from '@meta-network/auth-sdk';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UCenterJWTPayload } from 'src/types';

@Injectable()
export class UCenterJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => req.cookies['ucenter_access_token'],
      secretOrKey: PUBLIC_KEYS.DEVELOPMENT,
      ignoreExpiration: process.env.NODE_ENV !== 'production',
    });
  }

  async validate(payload: UCenterJWTPayload) {
    const result = {
      id: payload.sub,
      ...payload,
    };
    return result;
  }
}
