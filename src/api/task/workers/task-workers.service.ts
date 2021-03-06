import { MetaWorker } from '@metaio/worker-model';
import { LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { v4 as uuid } from 'uuid';

import { DataNotFoundException } from '../../../exceptions';
import { QueueTaskConfig } from '../../../types';
import { TaskStepsJobProcessor } from '../processors/task-steps.job-processor';
import { TaskDispatchersService } from './task-dispatchers.service';

export class TaskWorkersService {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    protected readonly taskMethods: MetaWorker.Enums.TaskMethod[],
    protected readonly jobProcessor: TaskStepsJobProcessor,
  ) {
    logger.debug(`taskMethods ${taskMethods}`, this.constructor.name);
    this.registerTaskMethods(taskMethods);
    for (const taskMethod of taskMethods) {
      this.workerQueue.process(taskMethod, async (job) => {
        logger.verbose(
          `Set renew site config task workspace lock timer siteConfigId: ${job.data.site.configId}`,
          this.constructor.name,
        );
        const timer = setInterval(
          () =>
            this.taskDispatchersService.renewSiteConfigTaskWorkspaceLock(
              job.data.site.configId,
              job.data.task.taskWorkspace,
            ),
          5000,
        );
        try {
          const result = await jobProcessor.process(job);

          return result;
        } finally {
          logger.verbose(
            `Clear renew site config task workspace lock timer siteConfigId: ${job.data.site.configId}`,
            this.constructor.name,
          );
          clearInterval(timer);
        }
      });
    }
    this.workerQueue.on(
      'progress',
      async (job, progress) => await this.onProgress(job, progress),
    );

    this.workerQueue.on(
      'waiting',
      async (jobId) => await this.onWaiting(jobId),
    );
    this.workerQueue.on(
      'completed',
      async (job, result) => await this.onComplete(job, result),
    );
    this.workerQueue.on(
      'failed',
      async (job, err) => await this.onFailed(job, err),
    );
    this.workerQueue.on('error', async (err) => await this.onError(err));
  }

  async findOneTaskForWorker(
    jobId: string,
    workerName: string,
  ): Promise<QueueTaskConfig> {
    const job = await this.workerQueue.getJob(jobId);
    this.logger.verbose(
      `Worker ${workerName} get task ${job.name}`,
      this.constructor.name,
    );
    if (job) return job.data;
    throw new DataNotFoundException('job data not found');
  }

  async addTask(taskMethod: MetaWorker.Enums.TaskMethod, cfg: QueueTaskConfig) {
    const job = await this.workerQueue.add(taskMethod, cfg, {
      jobId: uuid(),
    });
    this.logger.verbose(
      `Successfully add task ${job.name}, taskId: ${job.data.task.taskId} jobId ${job.id}`,
      this.constructor.name,
    );
    const active = await this.workerQueue.getActiveCount();
    const complete = await await this.workerQueue.getCompletedCount();
    const delayed = await this.workerQueue.getDelayedCount();
    const failed = await this.workerQueue.getFailedCount();
    this.logger.debug(
      `Queue: ${this.workerQueue.name} active: ${active} complete: ${complete} delayed: ${delayed} failed: ${failed}`,
      this.constructor.name,
    );
  }

  async updateTaskForWorker(
    jobId: string,
    workerName: string,
    taskReport: MetaWorker.Info.TaskReport,
  ): Promise<void> {
    this.logger.verbose(
      `Worker ${workerName} report ${taskReport.reason} reason on ${taskReport.timestamp}`,
      this.constructor.name,
    );

    if (taskReport.reason === MetaWorker.Enums.TaskReportReason.HEALTH_CHECK) {
      const job = await this.workerQueue.getJob(jobId);
      if (job && job.data) {
        this.taskDispatchersService.renewSiteConfigTaskWorkspaceLock(
          job.data.site.configId,
          job.data.task.taskWorkspace,
        );
      }
    }
  }

  protected async onProgress(job, progress) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is progressing, progress ${progress}`,
      this.constructor.name,
    );
  }

  protected async onWaiting(jobId) {
    this.logger.verbose(`Job ${jobId} is waiting`, this.constructor.name);
  }

  protected async onComplete(job, result) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is completed`,

      this.constructor.name,
    );

    if (job && job.data && job.data.task && job.data.taskStepChain) {
      await this.taskDispatchersService.nextTaskStep(job.data, result);
    }
  }

  protected async onFailed(job, err) {
    this.logger.error(
      `Task ${job.data.task.taskId} ${job.name} ${job.id} failed `,
      err,
    );
    job &&
      job.data &&
      job.data.task &&
      job.data.task.taskId &&
      (await this.taskDispatchersService.rejectTask(job.data.task.taskId, err));
  }

  protected async onError(err) {
    this.logger.error(`Queue Error: ${this.workerQueue.name}`, err);
  }

  private static taskMethodWorker = {};
  static getTaskWorker(
    taskMethod: MetaWorker.Enums.TaskMethod,
  ): TaskWorkersService {
    return TaskWorkersService.taskMethodWorker[taskMethod];
  }

  protected registerTaskMethod(taskMethod: MetaWorker.Enums.TaskMethod) {
    TaskWorkersService.taskMethodWorker[taskMethod] = this;
  }
  protected registerTaskMethods(taskMethods: MetaWorker.Enums.TaskMethod[]) {
    for (const taskMethod of taskMethods) {
      TaskWorkersService.taskMethodWorker[taskMethod] = this;
    }
  }
}
