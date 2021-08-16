import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RemoveIndex, RequestWithUser, UCenterJWTPayload } from 'src/types';

export const User = createParamDecorator(
  (data: keyof RemoveIndex<UCenterJWTPayload>, ctx: ExecutionContext) => {
    const req: RequestWithUser = ctx.switchToHttp().getRequest();
    const user = req.user;
    return data ? user[data] : user;
  },
);
