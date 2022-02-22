import { MetaWorker } from '@metaio/worker-model2';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { BasicAuth, SkipUCenterAuth, User } from '../../../decorators';
import { WorkerModel2TaskConfig } from '../../../types/worker-model2';
import { PostMethodValidation } from '../../../utils/validation';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

export class WorkerTaskDispatchDto {
  @ApiProperty({
    description: '是否自动失败',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoFailed?: boolean;
}

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

  @Patch(':workerTaskId/reports')
  @Post(':workerTaskId/reports')
  @UsePipes(new ValidationPipe(PostMethodValidation))
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
  @Post('/next-task')
  // @SkipUCenterAuth(true)
  async nextTask() {
    await this.workerTasksDispatcherService.nextTask();
  }

  @Post(':siteConfigId/deploy-site')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploySite(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    if (await this.workerTasksDispatcherService.hasTaskInProgress(userId)) {
      throw new ConflictException('Having Task in progreses');
    }
    return await this.workerTasksDispatcherService.dispatchDeploySiteTask(
      siteConfigId,
      userId,
      workerTaskDispatchDto.autoFailed,
    );
  }

  @Post(':siteConfigId/create-posts')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async createPosts(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    if (await this.workerTasksDispatcherService.hasTaskInProgress(userId)) {
      throw new ConflictException('Having Task in progreses');
    }
    return await this.workerTasksDispatcherService.dispatchCreatePostsTask(
      siteConfigId,
      userId,
      workerTaskDispatchDto.autoFailed,
    );
  }

  @Post(':siteConfigId/publish-site')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async publishSite(
    @User('id', ParseIntPipe) userId: number,
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    if (await this.workerTasksDispatcherService.hasTaskInProgress(userId)) {
      throw new ConflictException('Having Task in progreses');
    }
    // await this.workerTasksDispatcherService.linkOrGeneratePublishSiteTask(
    //   siteConfigId,
    //   userId,
    // );
    return await this.workerTasksDispatcherService.dispatchPublishSiteTask(
      siteConfigId,
      userId,
      workerTaskDispatchDto.autoFailed,
    );
  }
}
