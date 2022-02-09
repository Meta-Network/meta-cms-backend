import {
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
  OnQueueProgress,
  Process,
  Processor,
} from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TaskWorkerJobProcessorType } from '../../../types/enum';
import { DockerProcessorsService } from './processors/docker/docker-processors.service';
import { MockProcessorsService } from './processors/mock/mock-processors.service';
import {
  WORKER_TASKS_JOB_PROCESSOR,
  WorkerTasksJobDetail,
  WorkerTasksJobProcessor,
} from './processors/worker-tasks.job-processor';

@Processor(WORKER_TASKS_JOB_PROCESSOR)
export class WorkerTasksConsumerService implements WorkerTasksJobProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly dockerProcessorsService: DockerProcessorsService,
    private readonly mockProcessorsService: MockProcessorsService,
  ) {}
  @Process()
  async process(job: Job<WorkerTasksJobDetail>) {
    return await this.getProcessor().process(job);
  }

  getProcessor(): WorkerTasksJobProcessor {
    const processorType = this.configService.get<TaskWorkerJobProcessorType>(
      `task.pipeline.processor.type`,
    );
    if (TaskWorkerJobProcessorType.DOCKER === processorType) {
      return this.dockerProcessorsService;
    } else {
      return this.mockProcessorsService;
    }
  }
  @OnQueueProgress()
  async onProgress(job: Job<WorkerTasksJobDetail>, progress: number) {
    this.logger.verbose(
      `Job task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} of type ${job.name} is progressing, progress ${progress}`,
      this.constructor.name,
    );
  }

  protected async onWaiting(jobId) {
    this.logger.verbose(`Job ${jobId} is waiting`, this.constructor.name);
  }

  @OnQueueCompleted()
  async onComplete(job: Job<WorkerTasksJobDetail>, result) {
    this.logger.verbose(
      `Job task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} of type ${job.name} is completed`,

      this.constructor.name,
    );
    // worker内部会通过report上报，不需要再在这里通知
    // if (job?.data?.taskConfig) {
    //   await this.workerTasksDispatcherService.finishTask(job?.data?.taskConfig);
    // }
  }

  @OnQueueFailed()
  async onFailed(job, err) {
    this.logger.error(
      `Job task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} failed `,
      err,
    );

    // worker内部会通过report上报，不需要再在这里通知一遍
    // if (job?.data?.taskConfig) {
    //   await this.workerTasksDispatcherService.rejectTask(
    //     job.data.task.taskId,
    //     err,
    //   );
    // }
  }
  @OnQueueError()
  async onError(err) {
    this.logger.error(`Queue Error ${err}`, this.constructor.name);
  }
}
