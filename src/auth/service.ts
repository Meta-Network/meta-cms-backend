import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import {
  JWTAudNotMatchException,
  JWTException,
  JWTExpiredException,
  RequirdHttpHeadersNotFoundException,
} from 'src/exceptions';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateJWT(req: Request) {
    const cookie = req.cookies;
    if (!cookie || !cookie.ucenter_access_token) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    const token: string = cookie.ucenter_access_token;

    try {
      this.jwtService.verify(token, {
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
