import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { RequirdHttpHeadersNotFoundException } from '../../exceptions';
import { AuthGuardType } from '../../types/enum';

@Injectable()
export class CMSAuthorizeGuard extends AuthGuard(AuthGuardType.CMS) {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    if (!authorization) {
      throw new RequirdHttpHeadersNotFoundException();
    }
    return super.canActivate(context);
  }
}
