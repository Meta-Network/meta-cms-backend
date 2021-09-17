import {
  Body,
  Controller,
  Inject,
  LoggerService,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SkipUCenterAuth, User } from '../../decorators';
import { ValidationException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { PostMethodValidation } from '../../utils/validation';
import { Tasks2Service } from './tasks.service';

class DeploySiteFromConfigDto {
  @ApiProperty({ description: 'Site config id', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  configId: number;
}

@ApiTags('task')
// @Controller('task')
export class TasksController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly service: Tasks2Service,
  ) {}

  @Post('deploy')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploySiteFromConfig(
    @User() user: UCenterJWTPayload,
    @Body() body: DeploySiteFromConfigDto,
  ) {
    if (!body && !body.configId)
      throw new ValidationException('request body does not contain configId');
    const siteConfigId = body.configId;
    this.logger.verbose(
      `User ${user.id} request deploy site from config ${siteConfigId}`,
      TasksController.name,
    );
    return await this.service.deploySite(user, siteConfigId);
  }
}
