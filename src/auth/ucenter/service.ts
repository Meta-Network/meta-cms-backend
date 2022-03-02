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
import { isDevelopment } from '../../utils';

@Injectable()
export class UCenterAuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  validateJWT(req: Request): Promise<Partial<UCenterJWTPayload>> {
    const cookie = req.cookies;
    const cookieName = this.configService.get<string>('jwt.ucenter.cookieName');
    if (!cookie || !cookie[cookieName]) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    const token: string = cookie[cookieName];

    try {
      return this.jwtService.verify(token, {
        ignoreExpiration: isDevelopment(),
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
