import { Module } from '@nestjs/common';

import { ManagementEthereumModule } from './management/module';

@Module({
  imports: [ManagementEthereumModule],
})
export class EthereumModule {}
