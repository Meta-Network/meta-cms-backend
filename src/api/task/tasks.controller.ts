import {
  Body,
  Controller,
  Inject,
  LoggerService,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SkipUCenterAuth } from '../../decorators';
import { PostMethodValidation } from '../../utils/validation';
import { Tasks2Service } from './tasks.service';

@ApiTags('tasks2')
@Controller('tasks2')
export class Tasks2Controller {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly service: Tasks2Service,
  ) {}

  @SkipUCenterAuth(true)
  @Post('deploy-sample')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploySiteFromConfig2() {
    const siteConfigId = 20,
      userId = 14;
    this.logger.verbose(
      `User ${userId} request deploy site from config ${siteConfigId}`,
      Tasks2Controller.name,
    );

    return await this.service.deploySite(
      {
        id: userId,
        username: 'test-deploy',
        nickname: 'test-deploy',
      },
      siteConfigId,
    );
  }
}
