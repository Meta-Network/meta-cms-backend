import { Request } from 'express';
import { Observable } from 'rxjs';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { validateRequestCookie } from '../validator/request';

@Injectable()
export class JWTAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const [state] = validateRequestCookie(request);
    if (state) return true;
    return super.canActivate(context);
  }
}
