import { Body, Controller, Inject, LoggerService, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { User } from '../../decorators';
import { ValidationException } from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { TasksService } from './service';

type DeploySiteFromConfigBody = {
  configId: number;
};

@ApiTags('task')
@Controller('task')
export class TasksController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly service: TasksService,
  ) {}

  @Post('deploy')
  async deploySiteFromConfig(
    @User() user: UCenterJWTPayload,
    @Body() body: DeploySiteFromConfigBody,
  ) {
    if (!body && !body.configId)
      throw new ValidationException('request body does not contain configId');
    const cid = body.configId;
    this.logger.verbose(
      `User ${user.id} request deploy site from config ${cid}`,
      TasksController.name,
    );
    return await this.service.deploySiteFromConfig(user, cid);
  }
}
