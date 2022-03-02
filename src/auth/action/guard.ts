import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { CMSManagementJWTPayload } from '../../types';
import { NestMetadataType, SkipAuthType } from '../../types/enum';
import { isDevelopment } from '../../utils';
import { ActionAuthorizationService } from './service';

@Injectable()
export class ActionAuthorizationGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
    private readonly service: ActionAuthorizationService,
  ) {}

  private readonly alloweds: SkipAuthType[] = [
    SkipAuthType.All,
    SkipAuthType.Action,
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.canSkipAuth(context);
    if (skip) {
      this.devDebug(`Skip Action authorize`);
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const {
      user,
      body,
    }: {
      user?: CMSManagementJWTPayload;
      body?: { initiator: string; name: string; signature: string };
    } = request;
    const address = await this.service.verifyAddressMatch(
      user?.sub,
      body?.initiator,
    );
    const action = await this.service.verifyAction(body);
    return address && action;
  }
}
