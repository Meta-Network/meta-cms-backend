import { Request } from 'express';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/service';

@Injectable()
export class JWTAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    this.authService.validateJWT(request);
    return super.canActivate(context);
  }
}
