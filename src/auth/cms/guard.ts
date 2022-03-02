import {
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { RequirdHttpHeadersNotFoundException } from '../../exceptions';
import {
  AuthGuardType,
  NestMetadataType,
  SkipAuthType,
} from '../../types/enum';
import { isDevelopment } from '../../utils';

@Injectable()
export class CMSAuthenticationGuard extends AuthGuard(AuthGuardType.CMS) {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  private readonly alloweds: SkipAuthType[] = [
    SkipAuthType.All,
    SkipAuthType.CMS,
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
      this.devDebug(`Skip CMS authorize`);
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    if (!authorization) {
      this.devDebug(`CMS authorization failed`);
      throw new RequirdHttpHeadersNotFoundException();
    }
    return super.canActivate(context);
  }
}
