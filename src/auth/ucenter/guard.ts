import {
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import assert from 'assert';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  ConfigKeyNotFoundException,
  RequirdHttpHeadersNotFoundException,
} from '../../exceptions';
import { RequestCookies } from '../../types';
import {
  AuthGuardType,
  NestMetadataType,
  SkipAuthType,
} from '../../types/enum';
import { isDevelopment } from '../../utils';

@Injectable()
export class UCenterAuthenticationGuard extends AuthGuard(
  AuthGuardType.UCenter,
) {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    super();
    this.cookieName = this.configService.get<string>('jwt.ucenter.cookieName');
    assert(
      this.cookieName,
      new ConfigKeyNotFoundException('jwt.ucenter.cookieName'),
    );
  }

  private readonly cookieName: string;
  private readonly alloweds: SkipAuthType[] = [
    SkipAuthType.All,
    SkipAuthType.UCenter,
  ];

  private devDebug(msg: string): void {
    const isDev = isDevelopment();
    isDev && this.logger.debug(msg, this.constructor.name);
  }

  private canSkipAuth(context: ExecutionContext): boolean {
    const types =
      this.reflector.get<SkipAuthType[]>(
        NestMetadataType.SkipAuth,
        context.getHandler(),
      ) || [];
    return types
      .map((type) => this.alloweds.includes(type))
      .some((value) => value === true);
  }

  canActivate(context: ExecutionContext) {
    const skip = this.canSkipAuth(context);
    if (skip) {
      this.devDebug(`Skip UCenter authorize`);
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const cookies: RequestCookies = request.cookies;
    const hasCookie = cookies[this.cookieName];
    if (!hasCookie) {
      this.devDebug(`UCenter authorization failed`);
      throw new RequirdHttpHeadersNotFoundException();
    }
    return super.canActivate(context);
  }
}
