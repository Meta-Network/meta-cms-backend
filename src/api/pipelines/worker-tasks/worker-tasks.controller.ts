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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

import {
  BasicAuth,
  SkipAllAuth,
  SkipUCenterAuth,
  User,
} from '../../../decorators';
import { AuthGuardType } from '../../../types/enum';
import { WorkerModel2TaskConfig } from '../../../types/worker-model2';
import { PostMethodValidation } from '../../../utils/validation';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

export class WorkerTaskDispatchDto {
  @ApiProperty({
    description: '要操作的用户ID',
    required: false,
    default: false,
  })
  @IsNumber()
  userId: number;
  @ApiProperty({
    description: '是否自动失败',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoFailed?: boolean;
}

export class WorkerTaskReportDto<T> implements MetaWorker.Info.TaskReport<T> {
  @ApiProperty({
    description: '任务ID',
    required: true,
  })
  taskId: string;
  @ApiProperty({
    description: '上报原因',
    required: true,
    enum: MetaWorker.Enums.TaskReportReason,
  })
  reason: MetaWorker.Enums.TaskReportReason;
  @ApiProperty({
    description: '上报时间戳',
    required: true,
  })
  timestamp: number;
  @ApiProperty({
    description: '上报内容',
    required: false,
  })
  data?: T;
}

@ApiTags('pipeline')
@Controller('v1/pipelines/worker-tasks')
export class WorkerTasksController {
  constructor(
    private readonly workerTasksDispatcherService: WorkerTasksDispatcherService,
  ) {}
  @Get(':workerTaskId')
  @SkipAllAuth()
  async getWorkerTaskById(
    @BasicAuth() auth: string,
    @Param('workerTaskId') workerTaskId: string,
  ): Promise<WorkerModel2TaskConfig> {
    return await this.workerTasksDispatcherService.getWorkerTaskById(
      auth,
      workerTaskId,
    );
  }

  @ApiBasicAuth('workerTaskAuth')
  // @Patch(':workerTaskId/reports')
  @Post(':workerTaskId/reports')
  @UsePipes(new ValidationPipe(PostMethodValidation))
  @SkipAllAuth()
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
  @SkipUCenterAuth()
  @UseGuards(AuthGuard(AuthGuardType.CMS))
  async nextTask() {
    await this.workerTasksDispatcherService.dispatchNextTask();
  }

  @Post(':siteConfigId/deploy-site')
  @SkipUCenterAuth()
  @UseGuards(AuthGuard(AuthGuardType.CMS))
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async deploySite(
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    const { userId } = workerTaskDispatchDto;
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
  @SkipUCenterAuth()
  @UseGuards(AuthGuard(AuthGuardType.CMS))
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async createPosts(
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    const { userId } = workerTaskDispatchDto;

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
  @SkipUCenterAuth()
  @UseGuards(AuthGuard(AuthGuardType.CMS))
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async publishSite(
    @Param('siteConfigId', ParseIntPipe) siteConfigId: number,
    @Body() workerTaskDispatchDto: WorkerTaskDispatchDto,
  ) {
    const { userId } = workerTaskDispatchDto;

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
