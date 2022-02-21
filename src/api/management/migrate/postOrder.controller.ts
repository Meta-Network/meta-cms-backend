import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MigratePostOrderService } from './postOrder.service';

@ApiTags('management')
@Controller('management')
export class MigratePostOrderController {
  constructor(private readonly service: MigratePostOrderService) {}

  @Post('migrate-v1-post-order-data')
  public async mgratePostOrder() {
    return await this.service.mgratePostOrder();
  }
}
