import { MetaWorker } from '@metaio/worker-model';
import {
  Body,
  Controller,
  Get,
  Inject,
  LoggerService,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';

import { BasicAuth, SkipUCenterAuth } from '../../../decorators';
import { QueueTaskConfig } from '../../../types';
import { TaskWorkersService } from './task-workers.service';

export class TaskWorksBaseController {
  constructor(protected readonly taskWorkersService: TaskWorkersService) {}

  @Get(':name')
  @SkipUCenterAuth(true)
  async findOneTaskForWorker(
    @BasicAuth(ParseUUIDPipe) auth: string,
    @Param('name') name: string,
  ): Promise<QueueTaskConfig> {
    return await this.taskWorkersService.findOneTaskForWorker(auth, name);
  }

  @Patch(':name')
  @SkipUCenterAuth(true)
  async updateTaskForWorker(
    @BasicAuth() auth: string,
    @Param('name') name: string,
    @Body() body: MetaWorker.Info.TaskReport,
  ): Promise<void> {
    await this.taskWorkersService.updateTaskForWorker(auth, name, body);
  }
}
