import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';

import {
  RemoveIndex,
  RequestWithUser,
  UCenterAccount,
  UCenterJWTPayload,
} from '../types';
import { NestMetadataType, SkipAuthType } from '../types/enum';

type UserParamDecoratorReturnType =
  | UCenterJWTPayload
  | UCenterAccount
  | string[]
  | string
  | number;

export const User = createParamDecorator<
  keyof RemoveIndex<UCenterJWTPayload>,
  ExecutionContext,
  UserParamDecoratorReturnType
>((data, ctx) => {
  const req: RequestWithUser = ctx.switchToHttp().getRequest();
  const user = req.user;
  return data ? user[data] : user;
});

export const ManagementUser = createParamDecorator<
  undefined,
  ExecutionContext,
  string
>((_, ctx) => {
  const { user } = ctx.switchToHttp().getRequest();
  return user.sub;
});

export const BasicAuth = createParamDecorator<
  unknown,
  ExecutionContext,
  string
>((_, ctx) => {
  const req: Request = ctx.switchToHttp().getRequest();
  const header = req.get('Authorization');
  const secret = header.replace('Basic ', '');
  return Buffer.from(secret, 'base64').toString();
});

export const SkipAuths = (...types: SkipAuthType[]) =>
  SetMetadata(NestMetadataType.SkipAuth, types);
export const SkipAllAuth = () => SkipAuths(SkipAuthType.All);
export const SkipUCenterAuth = () => SkipAuths(SkipAuthType.UCenter);
