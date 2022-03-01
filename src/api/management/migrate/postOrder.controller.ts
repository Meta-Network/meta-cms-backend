import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { ManagementUser, SkipUCenterAuth } from '../../../decorators';
import { AuthGuardType } from '../../../types/enum';
import { MigratePostOrderService } from './postOrder.service';

@ApiTags('management')
@Controller('management')
export class MigratePostOrderController {
  constructor(private readonly service: MigratePostOrderService) {}

  @Post('migrate-v1-post-order-data')
  @SkipUCenterAuth(true)
  @UseGuards(AuthGuard(AuthGuardType.CMS))
  public async mgratePostOrder(@ManagementUser() user: string) {
    // TODO: add body and change service method param
    return await this.service.mgratePostOrder();
  }
}
