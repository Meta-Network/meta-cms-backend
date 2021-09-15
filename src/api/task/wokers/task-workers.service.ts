import { MetaWorker } from '@metaio/worker-model';
import { LoggerService } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { v4 as uuid } from 'uuid';

import { QueueTaskConfig } from '../../../types';
import { DockerTasksService } from '../docker/service';
import { TaskDispatchersService } from './task-dispatchers.service';

export abstract class TaskWorkersService {
  constructor(
    protected readonly logger: LoggerService,
    protected readonly workerQueue: Queue<QueueTaskConfig>,
    protected readonly taskDispatchersService: TaskDispatchersService,
    protected readonly dockerTasksService: DockerTasksService,
    protected readonly dockerImageName: string,
    protected readonly taskMethods: MetaWorker.Enums.TaskMethod[],
  ) {
    logger.verbose('taskMethods', taskMethods, this.constructor.name);
    this.registerTaskMethods(taskMethods);
    for (const taskMethod of taskMethods) {
      this.workerQueue.process(
        taskMethod,
        async (job) => await this.process(job),
      );
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

  async addTask(taskMethod: MetaWorker.Enums.TaskMethod, cfg: QueueTaskConfig) {
    const job = await this.workerQueue.add(taskMethod, cfg, {
      jobId: uuid(),
    });
    this.logger.verbose(
      `Successfully add task ${job.name}, taskId: ${job.data.taskId} jobId ${job.id}`,
      TaskWorkersService.name,
    );
    this.logger.verbose(
      `Queue: ${
        this.workerQueue.name
      } active: ${await this.workerQueue.getActiveCount()} complete: ${await this.workerQueue.getCompletedCount()} delayed: ${await this.workerQueue.getDelayedCount()} failed: ${await this.workerQueue.getFailedCount()}`,
    );
  }

  protected async process(job) {
    // await this.dockerTasksService.startDockerContainer(
    //   this.dockerImageName,
    //   job.id,
    // );
    // return job.id;

    setTimeout(() => job.progress(42), 500);
    setTimeout(() => {
      job.progress(88);
      this.logger.debug(
        `Executing task ${job.data.taskId} method ${job.data.taskMethod}`,
        this.constructor.name,
      );
    }, 1000);
    return await new Promise((resolve, reject) => {
      const rnd = Math.random();

      setTimeout(
        () => (rnd < 0.8 ? resolve(job.id) : reject(new Error('Random Error'))),
        1500,
      );
    });
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
    // console.log(job);
    // console.log(job.data);
    job &&
      job.data &&
      job.data.taskId &&
      job.data.taskSteps &&
      job.data.taskStepIndex !== undefined &&
      job.data.taskStepIndex !== null &&
      (await this.taskDispatchersService.nextTaskStep(job.data, result));
  }

  protected async onFailed(job, err) {
    this.logger.error(job, err);
    job &&
      job.data &&
      job.data.taskId &&
      (await this.taskDispatchersService.rejectTask(job.data.taskId, err));
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
