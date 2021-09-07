import { MetaWorker } from '@metaio/worker-model';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { BullProcessorType, BullQueueType } from '../../../constants';
import { AppCacheService } from '../../cache/service';

@Injectable()
export class GitWorkerTaskService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<MetaWorker.Configs.GitWorkerTaskConfig>,
    private readonly cache: AppCacheService,
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
    let taskMethod: MetaWorker.Enums.TaskMethod;
    if (type === BullProcessorType.CREATE_SITE) {
      taskMethod = MetaWorker.Enums.TaskMethod.CREATE_REPO_FROM_TEMPLATE;
    }
    if (type === BullProcessorType.UPDATE_SITE) {
      taskMethod = MetaWorker.Enums.TaskMethod.UPDATE_REPO_USE_TEMPLATE;
    }

    const taskId = uuid(); // taskId and taskWorkspace hash
    const confIdStr = conf.configId.toString(); // cache unique key

    let taskWorkspace = await this.cache.get<string>(confIdStr);
    this.logger.verbose(
      `Get config ${confIdStr} task workspace from cache ${taskWorkspace}`,
      GitWorkerTaskService.name,
    );
    if (!taskWorkspace) {
      const taskIdHash = crypto
        .createHash('sha256')
        .update(taskId)
        .digest('hex');
      taskWorkspace = taskIdHash.substring(taskIdHash.length - 16);
      const _cache = await this.cache.set(confIdStr, taskWorkspace, 60 * 10); // 10min cache
      this.logger.verbose(
        `Can not get task workspace from cache, generate new ${taskWorkspace} for config ${confIdStr} ${_cache}`,
        GitWorkerTaskService.name,
      );
    }

    const taskInfo: MetaWorker.Info.Task = {
      taskId,
      taskMethod,
      taskWorkspace,
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
