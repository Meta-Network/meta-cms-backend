import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { ActionGuard } from '../../../auth/action/guard';
import { ManagementUser, SkipUCenterAuth } from '../../../decorators';
import {
  AccessDeniedException,
  ValidationException,
} from '../../../exceptions';
import { AuthGuardType } from '../../../types/enum';
import { TransformCreatedResponse } from '../../../utils/responseClass';
import {
  MgratePostOrderReturn,
  MigratePostOrderService,
} from './postOrder.service';

class MgratePostOrderJobCounts implements MgratePostOrderReturn {
  @ApiProperty({ description: 'New add to queue' })
  new: number;
  @ApiProperty({ description: 'Bull active' })
  active: number;
  @ApiProperty({ description: 'Bull completed' })
  completed: number;
  @ApiProperty({ description: 'Bull failed' })
  failed: number;
  @ApiProperty({ description: 'Bull delayed' })
  delayed: number;
  @ApiProperty({ description: 'Bull waiting' })
  waiting: number;
}

class MgratePostOrderResponse extends TransformCreatedResponse<MgratePostOrderReturn> {
  @ApiProperty({ type: MgratePostOrderJobCounts })
  readonly data: MgratePostOrderReturn;
}

@ApiTags('management')
@Controller('management')
export class MigratePostOrderController {
  constructor(private readonly service: MigratePostOrderService) {}

  @ApiCreatedResponse({ type: MgratePostOrderResponse })
  @ApiBadRequestResponse({ type: ValidationException })
  @ApiForbiddenResponse({ type: AccessDeniedException })
  @Post('migrate-v1-post-order-data')
  @SkipUCenterAuth()
  @UseGuards(
    AuthGuard(AuthGuardType.CMS),
    ActionGuard(['MIGRATE_V1_POST_ORDER_DATA']),
  )
  public async mgratePostOrder(@ManagementUser() user: string) {
    return await this.service.mgratePostOrder(user);
  }
}
