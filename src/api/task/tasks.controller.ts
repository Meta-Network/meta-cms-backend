import {
  Body,
  Controller,
  Inject,
  LoggerService,
  Param,
  ParseIntPipe,
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
import { TasksService } from './tasks.service';

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

  @SkipUCenterAuth(true)
  @Post('deploy-sample/:userId')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploySiteFromConfig2(
    @Body() body: DeploySiteFromConfigDto,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const { configId } = body;
    this.logger.verbose(
      `User ${userId} request deploy site from config ${configId}`,
      TasksController.name,
    );

    return await this.service.deploySite(
      {
        id: userId,
        username: 'test-deploy',
        nickname: 'test-deploy',
      },
      configId,
    );
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

  @SkipUCenterAuth(true)
  @Post('publish-sample/:userId')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async publishSiteFromConfig2(
    @Body() body: PublishSiteFromConfigDto,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const { configId } = body;
    this.logger.verbose(
      `User ${userId} request publish site from config ${configId}`,
      TasksController.name,
    );

    return await this.service.publishSite(
      {
        id: userId,
        username: 'test-deploy',
        nickname: 'test-deploy',
      },
      configId,
    );
  }
}
