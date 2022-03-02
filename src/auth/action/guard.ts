import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
  mixin,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { NestMetadataType, SkipAuthType } from '../../types/enum';
import { isDevelopment } from '../../utils';
import { ActionAuthorizationService } from './service';

type ActionBody = { initiator: string; name: string; signature: string };

type ActionRequest = Request<ParamsDictionary, any, ActionBody>;

export const ActionGuard = (
  roles: string[],
): Type<ActionAuthorizationGuard> => {
  class ActionGuardMixin
    extends ActionAuthorizationGuard
    implements CanActivate
  {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      super.roles = roles;
      return super.canActivate(context);
    }
  }
  const guard = mixin(ActionGuardMixin);
  return guard;
};

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
  protected roles: string[] = [];

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
    const request: ActionRequest = context.switchToHttp().getRequest();
    const { user, body } = request;
    const address = await this.service.verifyAddressMatch(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore // Fuck @types/passport
      user?.sub,
      body?.initiator,
    );
    const action = await this.service.verifyAction(body);
    const hasRole = await this.service.verifyRole(this.roles, body.name);
    return address && action && hasRole;
  }
}
