import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PUBLIC_KEYS } from '@meta-network/auth-sdk';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UCenterJWTPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => req.cookies['ucenter_accessToken'],
      ignoreExpiration: false,
      secretOrKey: PUBLIC_KEYS.DEVELOPMENT,
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
