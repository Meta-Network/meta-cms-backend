import { MetaWorker } from '@metaio/worker-model';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { AppCacheService } from '../../../cache/service';
import { QueueTaskConfig } from '../../../types';
import { TaskWorkersService } from './task-workers.service';

@Injectable()
export class TaskDispatchersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly cache: AppCacheService,
    private readonly configService: ConfigService,
  ) {}

  private readonly taskPromises = {};
  private readonly resolveCallbacks = {};
  private readonly rejectCallbacks = {};

  async dispatchTask(
    taskSteps: MetaWorker.Enums.TaskMethod[],
    cfg:
      | MetaWorker.Configs.DeployConfig
      | MetaWorker.Configs.PublishConfig
      | MetaWorker.Configs.PostConfig,
    exitTaskWorkspace = false,
  ) {
    const taskConfig = await this.initQueueTaskConfig(taskSteps, cfg);
    this.logger.debug(
      `taskConfig ${JSON.stringify(taskConfig)}`, // TODO(550): remove user git token.
      this.constructor.name,
    );
    const promise = (this.taskPromises[taskConfig.task.taskId] = new Promise(
      (resolve, reject) => {
        this.resolveCallbacks[taskConfig.task.taskId] = resolve;
        this.rejectCallbacks[taskConfig.task.taskId] = reject;
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
      this.logger.error(`Pipeline Exception: ${err}`, this.constructor.name);
      throw new InternalServerErrorException('Pipeline Exception');
    } finally {
      if (exitTaskWorkspace) {
        this.removeSiteConfigTaskWorkspaceLock(
          taskConfig.site.configId,
          taskConfig.task.taskWorkspace,
        );
      }
    }
  }

  async nextTaskStep(cfg: QueueTaskConfig, stepResult: any) {
    cfg.taskStepChain.taskStepResults[cfg.task.taskMethod] = stepResult;
    if (
      cfg.taskStepChain.taskStepIndex <
      cfg.taskStepChain.taskSteps.length - 1
    ) {
      cfg.taskStepChain.taskStepIndex += 1;
      cfg.task.taskMethod =
        cfg.taskStepChain.taskSteps[cfg.taskStepChain.taskStepIndex];
      this.logger.verbose(
        `next task step taskId ${cfg.task.taskId}, taskMethod ${
          cfg.task.taskMethod
        } taskStepResults ${JSON.stringify(cfg.taskStepChain.taskStepResults)}`,
        this.constructor.name,
      );
      await this.invokeTaskMethod(cfg);
    } else {
      this.logger.verbose(
        `last task step taskId ${
          cfg.task.taskId
        }, taskStepResults ${JSON.stringify(
          cfg.taskStepChain.taskStepResults,
        )}`,
        this.constructor.name,
      );
      await this.resolveTask(
        cfg.task.taskId,
        cfg.taskStepChain.taskStepResults,
      );
    }
  }

  async resolveTask(taskId: string, result: any) {
    this.resolveCallbacks[taskId] &&
      (await this.resolveCallbacks[taskId](result));
    this.removeTaskPromise(taskId);
  }
  async rejectTask(taskId: string, err: Error) {
    this.rejectCallbacks[taskId] && (await this.rejectCallbacks[taskId](err));
    this.removeTaskPromise(taskId);
  }

  protected async removeTaskPromise(taskId: string) {
    delete this.taskPromises[taskId];
    delete this.resolveCallbacks[taskId];
    delete this.rejectCallbacks[taskId];
  }
  protected async getPromise(taskId: string) {
    return await this.taskPromises[taskId];
  }

  protected async invokeTaskMethod(cfg: QueueTaskConfig) {
    const taskMethod = cfg.task.taskMethod;
    if (!taskMethod) {
      return this.rejectTask(cfg.task.taskId, new Error('Invalid task method'));
    }
    const worker = TaskWorkersService.getTaskWorker(taskMethod);
    if (!worker) {
      return this.rejectTask(
        cfg.task.taskId,
        new Error(`Could not find worker for task method ${taskMethod}`),
      );
    }

    worker.addTask(taskMethod, cfg);
  }

  protected async initQueueTaskConfig(
    taskSteps: MetaWorker.Enums.TaskMethod[],
    cfg:
      | MetaWorker.Configs.DeployConfig
      | MetaWorker.Configs.PublishConfig
      | MetaWorker.Configs.PostConfig
      | MetaWorker.Configs.DnsConfig,
  ) {
    const taskId = uuid();
    const taskWorkspace = await this.tryGetSiteConfigTaskWorkspaceLock(
      cfg.site.configId,
    );
    if (!taskWorkspace) {
      throw new ConflictException('No available task workspace.');
    }
    const taskStepIndex = 0;
    const taskMethod = taskSteps[taskStepIndex];
    const task: MetaWorker.Info.Task = {
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
      ...cfg,
      task,
      taskStepChain,
    };
    return taskConfig;
  }

  protected async doGenerateTaskIdAndTaskWorkspace(
    siteConfigId: number,
  ): Promise<string> {
    const taskIdHash = crypto.createHash('sha256').update(uuid()).digest('hex');
    const taskWorkspace = taskIdHash.substring(taskIdHash.length - 16);
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

  public async checkAndGetSiteConfigTaskWorkspace(
    siteConfigId: number,
    // taskWorkspaceInUse?: string,
  ): Promise<string> {
    // check task workspace is existed
    const taskWorkspace = await this.getOrGenTaskWorkspace(siteConfigId);
    // if (taskWorkspace && taskWorkspace !== taskWorkspaceInUse) {
    //   throw new ConflictException(
    //     `Task workspace is existed: site config ${siteConfigId}`,
    //   );
    // }
    this.logger.debug(
      `Check site config task workspace return ${taskWorkspace}`,
      this.constructor.name,
    );
    return taskWorkspace;
  }

  public async getOrGenTaskWorkspace(siteConfigId: number): Promise<string> {
    const taskWorkspace = await this.tryGetSiteConfigTaskWorkspaceLock(
      siteConfigId,
    );
    if (taskWorkspace) {
      return taskWorkspace;
    }
    return await this.doGenerateTaskIdAndTaskWorkspace(siteConfigId);
  }

  public async tryGetSiteConfigTaskWorkspaceLock(
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

  public async renewSiteConfigTaskWorkspaceLock(
    siteConfigId: number,
    taskWorkspace: string,
  ) {
    const confIdStr = siteConfigId.toString();
    const siteConfigTaskWorkspaceKey = `SITE_CONFIG_${confIdStr}`;
    const ttl = this.configService.get<number>('task.workspace.lock.ttl');
    return await this.cache.set(siteConfigTaskWorkspaceKey, taskWorkspace, ttl);
  }

  public async removeSiteConfigTaskWorkspaceLock(
    siteConfigId: number,
    taskWorkspace: string,
  ) {
    const confIdStr = siteConfigId.toString();
    const siteConfigTaskWorkspaceKey = `SITE_CONFIG_${confIdStr}`;
    const cackeValue = await this.cache.get(siteConfigTaskWorkspaceKey);
    if (cackeValue === taskWorkspace) {
      return await this.cache.del(siteConfigTaskWorkspaceKey);
    }
  }
}
