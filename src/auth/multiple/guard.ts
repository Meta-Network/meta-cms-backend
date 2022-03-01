import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { NestMetadataType } from '../../types/enum';
import { CMSAuthorizeGuard } from '../cms/guard';
import { UCenterAuthorizeGuard } from '../ucenter/guard';

@Injectable()
export class MultipleAuthorizeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ucenterGuard: UCenterAuthorizeGuard,
    private readonly cmsGuard: CMSAuthorizeGuard,
  ) {}

  private canSkipAuth(
    context: ExecutionContext,
    type: NestMetadataType,
  ): boolean {
    return this.reflector.get<boolean>(type, context.getHandler());
  }

  canActivate(ctx: ExecutionContext) {
    const skipAll = this.canSkipAuth(ctx, NestMetadataType.SkipAllAuth);
    const skipUCenter = this.canSkipAuth(ctx, NestMetadataType.SkipUCenterAuth);
    const skipCMS = this.canSkipAuth(ctx, NestMetadataType.SkipCMSAuth);

    if (skipAll) return true;

    // Skip UCenter + CMS = Skip all
    if (skipUCenter && skipCMS) return true;

    if (skipUCenter) {
      // Skip UCenter go to CMS authorize
      return this.cmsGuard.canActivate(ctx);
    }

    // By default go to UCenter authorize,
    // if skip cms also go to UCenter authorize
    return this.ucenterGuard.canActivate(ctx);
  }
}
