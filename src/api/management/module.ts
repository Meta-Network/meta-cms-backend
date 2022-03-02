import { Module } from '@nestjs/common';

import { ManagementAuthorizationModule } from './authorization/module';
import { MigratePostOrderModule } from './migrate/postOrder.module';

@Module({
  imports: [ManagementAuthorizationModule, MigratePostOrderModule],
})
export class ManagementModule {}
