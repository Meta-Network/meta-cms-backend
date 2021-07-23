/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestWithJWTPayload } from '../types';
import { validateRequestCookie } from '../validator/request';

@Injectable()
export class JWTPayloadMiddleware implements NestMiddleware {
  use(req: RequestWithJWTPayload, res: Response, next: NextFunction) {
    const [_, payload] = validateRequestCookie(req);
    req.body = {
      ...req.body,
      jwtPayload: payload,
    };
    console.log(req);
    next();
  }
}
