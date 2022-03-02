import { MetaWorker } from '@metaio/worker-model';
import { Body, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';

import { BasicAuth, SkipAllAuth } from '../../../decorators';
import { QueueTaskConfig } from '../../../types';
import { TaskWorkersService } from './task-workers.service';

export class TaskWorkersBaseController {
  constructor(protected readonly taskWorkersService: TaskWorkersService) {}

  @Get(':name')
  @SkipAllAuth(true)
  async findOneTaskForWorker(
    @BasicAuth(ParseUUIDPipe) auth: string,
    @Param('name') name: string,
  ): Promise<QueueTaskConfig> {
    return await this.taskWorkersService.findOneTaskForWorker(auth, name);
  }

  @Patch(':name')
  @SkipAllAuth(true)
  async updateTaskForWorker(
    @BasicAuth() auth: string,
    @Param('name') name: string,
    @Body() body: MetaWorker.Info.TaskReport,
  ): Promise<void> {
    await this.taskWorkersService.updateTaskForWorker(auth, name, body);
  }
}
