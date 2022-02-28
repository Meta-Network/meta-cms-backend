import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import assert from 'assert';
import { Request } from 'express';

import {
  ConfigKeyNotFoundException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { RequestCookies } from '../../types';
import { UCenterAuthorizeService } from './service';

@Injectable()
export class UCenterAuthorizeGuard extends AuthGuard('jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: UCenterAuthorizeService,
  ) {
    super();
    this.cookieName = this.configService.get<string>('jwt.ucenter.cookieName');
    assert(
      this.cookieName,
      new ConfigKeyNotFoundException('jwt.ucenter.cookieName'),
    );
  }

  private readonly cookieName: string;

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const cookies: RequestCookies = request.cookies;
    const hasCookie = cookies[this.cookieName];
    if (!hasCookie) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    this.authService.validateJWT(request);
    return super.canActivate(context);
  }
}
