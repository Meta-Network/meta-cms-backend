import { Module } from '@nestjs/common';

import { CMSAuthenticationModule } from '../../../auth/cms/module';
import { ManagementEthereumService } from '../ethereum/service';
import { ManagementAuthorizationController } from './controller';
import { ManagementAuthorizationService } from './service';

@Module({
  imports: [CMSAuthenticationModule],
  controllers: [ManagementAuthorizationController],
  providers: [ManagementEthereumService, ManagementAuthorizationService],
})
export class ManagementAuthorizationModule {}
