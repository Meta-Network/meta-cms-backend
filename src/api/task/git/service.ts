import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { BullProcessorType, BullQueueType } from '../../../constants';

@Injectable()
export class GitWorkerTaskService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<MetaWorker.Configs.GitWorkerTaskConfig>,
  ) {}

  private async addTaskQueue(
    type: BullProcessorType,
    cfg: MetaWorker.Configs.GitWorkerTaskConfig,
  ) {
    const job = await this.gitQueue.add(type, cfg, { jobId: cfg.taskId });
    this.logger.verbose(
      `Successfully add task queue, taskId: ${job.data.taskId}`,
      GitWorkerTaskService.name,
    );
  }

  // @Interval(30000)
  // protected async processTaskQueue(): Promise<void> {
  //   const _waiting = await this.gitQueue.getJobs(['waiting']);
  //   this.logger.verbose(
  //     `Current have ${_waiting.length} waiting jobs`,
  //     GitWorkerTaskService.name,
  //   );
  // }

  async addGitWorkerQueue(
    type: BullProcessorType,
    conf: MetaWorker.Configs.GitWorkerConfig,
  ): Promise<void> {
    const taskMethod: MetaWorker.Enums.TaskMethod =
      type === BullProcessorType.CREATE_SITE
        ? MetaWorker.Enums.TaskMethod.CREATE_REPO_FROM_TEMPLATE
        : MetaWorker.Enums.TaskMethod.CREATE_REPO_FROM_TEMPLATE;
    const taskInfo: MetaWorker.Info.Task = {
      taskId: uuid(),
      taskMethod,
    };

    const taskConfig: MetaWorker.Configs.GitWorkerTaskConfig = {
      ...taskInfo,
      ...conf,
    };

    this.logger.verbose(
      `[addGitWorkerQueue] Add git worker queue task ${taskConfig.taskId} method ${taskConfig.taskMethod}`,
      GitWorkerTaskService.name,
    );
    await this.addTaskQueue(type, taskConfig);
  }
}
