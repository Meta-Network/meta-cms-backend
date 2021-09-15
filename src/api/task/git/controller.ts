import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
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
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { BullQueueType } from '../../../constants';
import { BasicAuth, SkipUCenterAuth } from '../../../decorators';
import { DataNotFoundException } from '../../../exceptions';
import { QueueTaskConfig } from '../../../types';
import { AppCacheService } from '../../cache/service';

@Controller('task/git')
export class GitWorkerTaskController {
  constructor(
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<QueueTaskConfig>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly cache: AppCacheService,
  ) {}

  @Get(':name')
  @SkipUCenterAuth(true)
  async findOneTask(
    @BasicAuth(ParseUUIDPipe) auth: string,
    @Param('name') name: string,
  ): Promise<QueueTaskConfig> {
    const job = await this.gitQueue.getJob(auth);
    this.logger.verbose(
      `Worker ${name} get task ${job.name}`,
      GitWorkerTaskController.name,
    );
    if (job) return job.data;
    this.logger.error(`Job data not found`, GitWorkerTaskController.name);
    throw new DataNotFoundException('job data not found');
  }

  @Patch(':name')
  @SkipUCenterAuth(true)
  async updateOne(
    @BasicAuth() auth: string,
    @Param('name') name: string,
    @Body() body: MetaWorker.Info.TaskReport,
  ): Promise<void> {
    this.logger.verbose(
      `Worker ${name} report ${body.reason} reason on ${body.timestamp}`,
      GitWorkerTaskController.name,
    );

    if (body.reason === MetaWorker.Enums.TaskReportReason.HEALTH_CHECK) {
      const job = await this.gitQueue.getJob(auth);
      if (job && job.data) {
        const key = job.data.configId.toString();
        const value = job.data.taskWorkspace;
        const ttl = 60 * 10;
        this.cache.set(key, value, 60 * 10);
        this.logger.verbose(
          `Update cache ${key} use ${value} ttl ${ttl} sec`,
          GitWorkerTaskController.name,
        );
      }
    }
  }
}
