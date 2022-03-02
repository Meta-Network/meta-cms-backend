import { Module } from '@nestjs/common';

import { ActionAuthorizationModule } from './action/module';
import { CMSAuthenticationModule } from './cms/module';
import { UCenterAuthenticationModule } from './ucenter/module';

@Module({
  imports: [
    UCenterAuthenticationModule,
    CMSAuthenticationModule,
    ActionAuthorizationModule,
  ],
})
export class AuthorizeModule {}
