import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { NestMetadataType } from 'src/constants';
import { RemoveIndex, RequestWithUser, UCenterJWTPayload } from 'src/types';

export const User = createParamDecorator(
  (data: keyof RemoveIndex<UCenterJWTPayload>, ctx: ExecutionContext) => {
    const req: RequestWithUser = ctx.switchToHttp().getRequest();
    const user = req.user;
    return data ? user[data] : user;
  },
);

export const SkipUCenterAuth = (skip: boolean) =>
  SetMetadata(NestMetadataType.SkipUCenterAuth, skip);
