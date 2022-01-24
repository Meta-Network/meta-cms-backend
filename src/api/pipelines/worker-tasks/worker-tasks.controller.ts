import { MetaWorker } from '@metaio/worker-model2';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BasicAuth, SkipUCenterAuth } from '../../../decorators';
import { MetaWorkerTaskConfigV2 } from '../../../types/worker-model2';
import { WorkerTasksLogicService } from './worker-tasks.logic.service';

@ApiTags('pipeline')
@Controller('v1/pipelines/worker-tasks')
export class WorkerTasksController {
  constructor(
    private readonly workerTasksLogicService: WorkerTasksLogicService,
  ) {}
  @Get(':workerTaskId')
  @SkipUCenterAuth(true)
  async findOneTaskForWorker(
    @BasicAuth() auth: string,
    @Param('workerTaskId') workerTaskId: string,
  ): Promise<MetaWorkerTaskConfigV2> {
    return await this.workerTasksLogicService.findOneTaskForWorker(
      auth,
      workerTaskId,
    );
  }

  @Post(':workerTaskId/report')
  @SkipUCenterAuth(true)
  async report(
    @BasicAuth() auth: string,
    @Param('workerTaskId') workerTaskId: string,
    @Body() taskReport: MetaWorker.Info.TaskReport,
  ): Promise<void> {
    await this.workerTasksLogicService.report(auth, workerTaskId, taskReport);
  }
}
