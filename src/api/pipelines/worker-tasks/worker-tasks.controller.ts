import { MetaWorker } from '@metaio/worker-model2';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BasicAuth, SkipUCenterAuth, User } from '../../../decorators';
import { WorkerModel2TaskConfig } from '../../../types/worker-model2';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

@ApiTags('pipeline')
@Controller('v1/pipelines/worker-tasks')
export class WorkerTasksController {
  constructor(
    private readonly workerTasksDispatcherService: WorkerTasksDispatcherService,
  ) {}
  @Get(':workerTaskId')
  @SkipUCenterAuth(true)
  async getWorkerTaskById(
    @BasicAuth() auth: string,
    @Param('workerTaskId') workerTaskId: string,
  ): Promise<WorkerModel2TaskConfig> {
    return await this.workerTasksDispatcherService.getWorkerTaskById(
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
    await this.workerTasksDispatcherService.report(
      auth,
      workerTaskId,
      taskReport,
    );
  }

  @Post(':siteConfigId/deploy-site')
  async deploySite(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
  ) {
    return await this.workerTasksDispatcherService.dispatchDeploySiteTask(
      siteConfigId,
      userId,
    );
  }

  @Post(':siteConfigId/create-posts')
  async createPosts(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
  ) {
    return await this.workerTasksDispatcherService.dispatchCreatePostsTask(
      siteConfigId,
      userId,
    );
  }

  @Post(':siteConfigId/publish-site')
  async publishSite(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
  ) {
    await this.workerTasksDispatcherService.linkOrGeneratePublishSiteTask(
      siteConfigId,
      userId,
    );
    return await this.workerTasksDispatcherService.dispatchPublishSiteTask(
      siteConfigId,
      userId,
    );
  }
}
