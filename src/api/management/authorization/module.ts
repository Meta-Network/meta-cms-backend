import { Module } from '@nestjs/common';

import { CMSAuthenticationModule } from '../../../auth/cms/module';
import { ManagementEthereumModule } from '../../../ethereum/management/module';
import { ManagementEthereumService } from '../../../ethereum/management/service';
import { ManagementAuthorizationController } from './controller';
import { ManagementAuthorizationService } from './service';

@Module({
  imports: [CMSAuthenticationModule, ManagementEthereumModule],
  controllers: [ManagementAuthorizationController],
  providers: [ManagementEthereumService, ManagementAuthorizationService],
})
export class ManagementAuthorizationModule {}
