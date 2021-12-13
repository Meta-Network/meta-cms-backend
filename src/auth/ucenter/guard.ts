import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { NestMetadataType } from '../../types/enum';
import { UCenterAuthService } from './service';

@Injectable()
export class UCenterJWTAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: UCenterAuthService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skip = this.reflector.get<boolean>(
      NestMetadataType.SkipUCenterAuth,
      context.getHandler(),
    );
    if (skip) return true;

    const request: Request = context.switchToHttp().getRequest();
    this.authService.validateJWT(request);
    return super.canActivate(context);
  }
}
