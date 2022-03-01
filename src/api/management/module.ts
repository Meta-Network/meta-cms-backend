import { Module } from '@nestjs/common';

import { ManagementAuthorizationModule } from './authorization/module';
import { ManagementEthereumModule } from './ethereum/module';
import { MigratePostOrderModule } from './migrate/postOrder.module';

@Module({
  imports: [
    ManagementEthereumModule,
    ManagementAuthorizationModule,
    MigratePostOrderModule,
  ],
})
export class ManagementModule {}
