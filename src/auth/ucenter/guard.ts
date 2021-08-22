import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { UCenterAuthService } from './service';

@Injectable()
export class UCenterJWTAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: UCenterAuthService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    this.authService.validateJWT(request);
    return super.canActivate(context);
  }
}
