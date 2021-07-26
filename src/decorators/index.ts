import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req: RequestWithUser = ctx.switchToHttp().getRequest();
    const user = req.user;
    return data ? user[data] : user;
  },
);
