import { Module } from '@nestjs/common';

import { ManagementEthereumModule } from '../../ethereum/management/module';
import { ActionAuthorizationGuard } from './guard';
import { ActionAuthorizationService } from './service';

@Module({
  imports: [ManagementEthereumModule],
  providers: [ActionAuthorizationService, ActionAuthorizationGuard],
  exports: [ActionAuthorizationService, ActionAuthorizationGuard],
})
export class ActionAuthorizationModule {}
