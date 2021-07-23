import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JWTAudNotMatchException,
  JWTException,
  JWTExpiredException,
  RequirdHttpHeadersNotFoundException,
} from '../exceptions';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateJWT(req: Request) {
    const cookie = req.cookies;
    if (!cookie || !cookie.ucenter_accessToken) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    const token: string = cookie.ucenter_accessToken;

    try {
      this.jwtService.verify(token);
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
