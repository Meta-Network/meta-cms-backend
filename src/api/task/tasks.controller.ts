import {
  Body,
  Controller,
  Get,
  Inject,
  LoggerService,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SkipUCenterAuth, User } from '../../decorators';
import { ValidationException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { TransformResponse } from '../../utils/responseClass';
import { PostMethodValidation } from '../../utils/validation';
import { TasksService } from './tasks.service';

class TaskWorkspaceLockedResponse extends TransformResponse<boolean> {
  @ApiProperty()
  readonly data: boolean;
}
class DeploySiteFromConfigDto {
  @ApiProperty({ description: 'Site config id', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  configId: number;
}
class PublishSiteFromConfigDto {
  @ApiProperty({ description: 'Site config id', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  configId: number;
}
@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly service: TasksService,
  ) {}

  @ApiOkResponse({ type: TaskWorkspaceLockedResponse })
  @Get('workspaces/:siteConfigId(\\d+)/locked')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async isSiteConfigTaskWorkspaceLocked(
    @User() user: UCenterJWTPayload,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
  ) {
    return await this.service.isSiteConfigTaskWorkspaceLocked(
      user.id,
      siteConfigId,
    );
  }

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

  @Post('publish')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async publishSiteFromConfig(
    @User() user: UCenterJWTPayload,
    @Body() body: PublishSiteFromConfigDto,
  ) {
    if (!body && !body.configId)
      throw new ValidationException('request body does not contain configId');
    const siteConfigId = body.configId;
    this.logger.verbose(
      `User ${user.id} request publish site from config ${siteConfigId}`,
      TasksController.name,
    );
    return await this.service.publishSite(user, siteConfigId);
  }

  @Post('deploy-publish')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deployAndPublishSiteFromConfig(
    @User() user: UCenterJWTPayload,
    @Body() body: PublishSiteFromConfigDto,
  ) {
    if (!body && !body.configId)
      throw new ValidationException('request body does not contain configId');
    const siteConfigId = body.configId;
    this.logger.verbose(
      `User ${user.id} request deploy&publish site from config ${siteConfigId}`,
      TasksController.name,
    );
    return await this.service.deployAndPublishSite(user, siteConfigId);
  }
}
