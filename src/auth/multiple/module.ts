import { Module } from '@nestjs/common';

import { CMSAuthorizeGuard } from '../cms/guard';
import { CMSAuthorizeModule } from '../cms/module';
import { UCenterAuthorizeGuard } from '../ucenter/guard';
import { UCenterAuthorizeModule } from '../ucenter/module';
@Module({
  imports: [UCenterAuthorizeModule, CMSAuthorizeModule],
  providers: [UCenterAuthorizeGuard, CMSAuthorizeGuard],
  exports: [UCenterAuthorizeGuard, CMSAuthorizeGuard],
})
export class MultipleAuthorizeModule {}
