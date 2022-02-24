import { Module } from '@nestjs/common';

import { MigratePostOrderModule } from './migrate/postOrder.module';

@Module({
  imports: [MigratePostOrderModule],
})
export class ManagementModule {}
