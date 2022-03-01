import { Module } from '@nestjs/common';

import { CMSAuthorizeModule } from '../../../auth/cms/module';
import { ManagementEthereumService } from '../ethereum/service';
import { ManagementAuthorizationController } from './controller';
import { ManagementAuthorizationService } from './service';

@Module({
  imports: [CMSAuthorizeModule],
  controllers: [ManagementAuthorizationController],
  providers: [ManagementEthereumService, ManagementAuthorizationService],
})
export class ManagementAuthorizationModule {}
