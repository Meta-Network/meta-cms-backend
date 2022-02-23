import {
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
  OnQueueProgress,
  OnQueueWaiting,
  Process,
  ProcessOptions,
  Processor,
} from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR,
  WorkerTasksDispatchNextJobDetail,
  WorkerTasksDispatchNextJobProcessor,
} from './processors/worker-tasks.job-processor';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

@Processor(WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR)
export class WorkerTasksDispatchNextConsumerService
  implements WorkerTasksDispatchNextJobProcessor
{
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,

    private readonly workerTasksDispatcherService: WorkerTasksDispatcherService,
  ) {}
  @Process({
    concurrency: 1,
  })
  @Process()
  async process(job: Job<WorkerTasksDispatchNextJobDetail>) {
    this.logger.verbose(
      `Process dispatch next task job id ${job.id} previousTaskId: ${job.data.previousTaskId}`,
      this.constructor.name,
    );
    await this.workerTasksDispatcherService.dispatchNextTask();
  }
  @OnQueueWaiting()
  protected async onWaiting(jobId) {
    this.logger.verbose(`Job ${jobId} is waiting`, this.constructor.name);
  }

  @OnQueueCompleted()
  async onComplete(job: Job<WorkerTasksDispatchNextJobDetail>, result) {
    this.logger.verbose(
      `Job ${job.id}  previousTaskId: ${job.data.previousTaskId} is completed`,
      this.constructor.name,
    );
  }
  @OnQueueFailed()
  async onFailed(job, err) {
    this.logger.error(
      `Job task ${job.id} previousTaskId: ${job.data.previousTaskId} failed `,
      err,
    );
  }

  @OnQueueError()
  async onError(err) {
    this.logger.error(`Queue Error ${err}`, this.constructor.name);
  }
}
