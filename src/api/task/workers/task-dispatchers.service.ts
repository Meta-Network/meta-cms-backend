import { MetaWorker } from '@metaio/worker-model';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
import crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { QueueTaskConfig } from '../../../types';
import { AppCacheService } from '../../cache/service';
import { TaskWorkersService } from './task-workers.service';

@Injectable()
export class TaskDispatchersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly cache: AppCacheService,
  ) {}

  private readonly taskPromises = {};
  private readonly resolveCallbacks = {};
  private readonly rejectCallbacks = {};

  async dispatchTask(
    taskSteps: MetaWorker.Enums.TaskMethod[],
    cfg: MetaWorker.Configs.DeployConfig | MetaWorker.Configs.PublishConfig,
  ) {
    const taskConfig = await this.initQueueTaskConfig(taskSteps, cfg);
    const promise = (this.taskPromises[taskConfig.taskId] = new Promise(
      (resolve, reject) => {
        this.resolveCallbacks[taskConfig.taskId] = resolve;
        this.rejectCallbacks[taskConfig.taskId] = reject;
        setTimeout(
          () => reject(new InternalServerErrorException('Pipeline Timeout')),
          60 * 60 * 1000,
        );
      },
    ));

    await this.invokeTaskMethod(taskConfig);
    try {
      return await promise;
    } catch (err) {
      throw new InternalServerErrorException('Pipeline Exception');
    }
  }

  async nextTaskStep(cfg: QueueTaskConfig, stepResult: any) {
    cfg.taskStepResults[cfg.taskMethod] = stepResult;
    if (cfg.taskStepIndex < cfg.taskSteps.length - 1) {
      cfg.taskStepIndex += 1;
      cfg.taskMethod = cfg.taskSteps[cfg.taskStepIndex];
      this.logger.verbose(
        `next task step taskId ${cfg.taskId}, taskMethod ${
          cfg.taskMethod
        } taskStepResults ${JSON.stringify(cfg.taskStepResults)}`,
        this.constructor.name,
      );
      await this.invokeTaskMethod(cfg);
    } else {
      this.logger.verbose(
        `last task step taskId ${cfg.taskId}, taskStepResults ${JSON.stringify(
          cfg.taskStepResults,
        )}`,
        this.constructor.name,
      );
      await this.resolveTask(cfg.taskId, cfg.taskStepResults);
    }
  }

  async resolveTask(taskId: string, result: any) {
    await this.resolveCallbacks[taskId](result);
  }
  async rejectTask(taskId: string, err: Error) {
    await this.rejectCallbacks[taskId](err);
  }
  protected async getPromise(taskId: string) {
    return await this.taskPromises[taskId];
  }

  protected async invokeTaskMethod(cfg: QueueTaskConfig) {
    const taskMethod = cfg.taskMethod;
    if (!taskMethod) {
      return this.rejectTask(cfg.taskId, new Error('Invalid task method'));
    }
    const worker = TaskWorkersService.getTaskWorker(taskMethod);
    if (!worker) {
      return this.rejectTask(
        cfg.taskId,
        new Error(`Could not find worker for task method ${taskMethod}`),
      );
    }

    worker.addTask(taskMethod, cfg);
  }
  protected async initQueueTaskConfig(
    taskSteps: MetaWorker.Enums.TaskMethod[],
    cfg: MetaWorker.Configs.DeployConfig | MetaWorker.Configs.PublishConfig,
  ) {
    const taskId = uuid(); // taskId and taskWorkspace hash
    const taskWorkspace = await this.getTaskWorkspace(taskId, cfg.configId);
    const taskStepIndex = 0;
    const taskMethod = taskSteps[taskStepIndex];
    const taskInfo: MetaWorker.Info.Task = {
      taskId,
      taskMethod,
      taskWorkspace,
    };
    const taskStepChain: MetaWorker.Info.TaskStepChain = {
      taskSteps,
      taskStepIndex,
      taskStepResults: {} as Record<MetaWorker.Enums.TaskMethod, any>,
    };

    const taskConfig: QueueTaskConfig = {
      ...taskInfo,
      ...cfg,
      ...taskStepChain,
    };
    return taskConfig;
  }

  protected async getTaskWorkspace(taskId: string, siteConfigId: number) {
    let taskWorkspace = await this.tryGetSiteConfigTaskWorkspaceLock(
      siteConfigId,
    );

    if (taskWorkspace) {
      return taskWorkspace;
    }
    const taskIdHash = crypto.createHash('sha256').update(taskId).digest('hex');
    taskWorkspace = taskIdHash.substring(taskIdHash.length - 16);
    const _cache = await this.renewSiteConfigTaskWorkspaceLock(
      siteConfigId,
      taskWorkspace,
    );
    this.logger.verbose(
      `Can not get task workspace from cache, generate new ${taskWorkspace} for config ${siteConfigId} ${_cache}`,
      TaskDispatchersService.name,
    );

    return taskWorkspace;
  }

  async tryGetSiteConfigTaskWorkspaceLock(
    siteConfigId: number,
  ): Promise<string> {
    const confIdStr = siteConfigId.toString();
    const siteConfigTaskWorkspaceKey = `SITE_CONFIG_${confIdStr}`;

    const taskWorkspace = await this.cache.get<string>(
      siteConfigTaskWorkspaceKey,
    );
    this.logger.verbose(
      `Get config ${confIdStr} task workspace from cache ${taskWorkspace}`,
      TaskDispatchersService.name,
    );
    return taskWorkspace;
  }

  async renewSiteConfigTaskWorkspaceLock(
    siteConfigId: number,
    taskWorkspace: string,
  ) {
    const confIdStr = siteConfigId.toString();
    const siteConfigTaskWorkspaceKey = `SITE_CONFIG_${confIdStr}`;
    return await this.cache.set(
      siteConfigTaskWorkspaceKey,
      taskWorkspace,
      60 * 2,
    );
  }
}
