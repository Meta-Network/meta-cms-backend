import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import {
  JWTAudNotMatchException,
  JWTException,
  JWTExpiredException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { UCenterJWTPayload } from '../../types';

@Injectable()
export class UCenterAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  validateJWT(req: Request): Promise<Partial<UCenterJWTPayload>> {
    const cookie = req.cookies;
    const cookieName = this.configService.get<string>('jwt.cookieName');
    if (!cookie || !cookie[cookieName]) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    const token: string = cookie[cookieName];

    try {
      return this.jwtService.verify(token, {
        ignoreExpiration: process.env.NODE_ENV !== 'production',
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new JWTExpiredException();
      }

      if (
        error instanceof JsonWebTokenError &&
        error.message.includes('audience')
      ) {
        throw new JWTAudNotMatchException();
      }

      throw new JWTException(error.message);
    }
  }
}
