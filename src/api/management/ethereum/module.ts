import { Module } from '@nestjs/common';

import { ManagementEthereumService } from './service';

@Module({
  providers: [ManagementEthereumService],
  exports: [ManagementEthereumService],
})
export class ManagementEthereumModule {}
