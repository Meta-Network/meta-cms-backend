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

@Controller('task/git')
export class GitWorkerTaskController {
  constructor(
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<MetaWorker.Configs.GitWorkerTaskConfig>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Get(':name')
  @SkipUCenterAuth(true)
  async findOneTask(
    @BasicAuth(ParseUUIDPipe) auth: string,
    @Param('name') name: string,
  ): Promise<MetaWorker.Configs.GitWorkerTaskConfig> {
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
    @Body() body: any,
  ): Promise<void> {
    this.logger.verbose(
      `Worker ${name} report ${body.reason} reason`,
      GitWorkerTaskController.name,
    );
    console.log('auth:', auth, '\nname:', name, '\nbody:', body);
  }
}
