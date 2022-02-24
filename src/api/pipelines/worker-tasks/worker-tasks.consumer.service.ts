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

import { configBuilder } from '../../../configs';
import { TaskWorkerJobProcessorType } from '../../../types/enum';
import { DockerProcessorsService } from './processors/docker/docker-processors.service';
import { MockProcessorsService } from './processors/mock/mock-processors.service';
import {
  WORKER_TASKS_JOB_PROCESSOR,
  WorkerTasksJobDetail,
  WorkerTasksJobProcessor,
} from './processors/worker-tasks.job-processor';
import { WorkerTasksDispatcherService } from './worker-tasks.dispatcher.service';

const config = configBuilder();
const processConfig = config?.pipeline?.processor?.consumer
  ?.process as ProcessOptions;

if (!processConfig) {
  throw new Error(`No config: pipeline.processor.consumer.process`);
}
if (!processConfig.concurrency) {
  throw new Error(`No config: pipeline.processor.consumer.process.concurrency`);
}
@Processor(WORKER_TASKS_JOB_PROCESSOR)
export class WorkerTasksConsumerService implements WorkerTasksJobProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly dockerProcessorsService: DockerProcessorsService,
    private readonly mockProcessorsService: MockProcessorsService,
    private readonly workerTasksDispatcherService: WorkerTasksDispatcherService,
  ) {
    ['pipeline.processor.type', 'pipeline.processor.consumer'].forEach(
      (configKey) => {
        const configValue = this.configService.get(configKey);
        if (configValue === undefined || configValue === null) {
          throw new Error(`No config: ${configKey}`);
        }
      },
    );
  }
  @Process(processConfig)
  async process(job: Job<WorkerTasksJobDetail>) {
    this.logger.verbose(
      `Process worker task: ${job.data.workerName} job id ${job.id}`,
      this.constructor.name,
    );
    this.workerTasksDispatcherService.processTask(job?.data?.taskConfig);
    await this.getProcessor().process(job);
  }

  getProcessor(): WorkerTasksJobProcessor {
    const processorType = this.configService.get<TaskWorkerJobProcessorType>(
      `pipeline.processor.type`,
    );
    this.logger.verbose(
      `Worker task processor type ${processorType}`,
      this.constructor.name,
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
  @OnQueueWaiting()
  protected async onWaiting(jobId) {
    this.logger.verbose(`Job ${jobId} is waiting`, this.constructor.name);
  }

  @OnQueueCompleted()
  async onComplete(job: Job<WorkerTasksJobDetail>) {
    this.logger.verbose(
      `Job task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} of type ${job.name} is completed`,

      this.constructor.name,
    );
    // worker内部POST单个异常会通过report上报，这里处理的是整体的结果
    if (job?.data?.taskConfig) {
      await this.workerTasksDispatcherService.finishTask(job?.data?.taskConfig);
    }
  }

  @OnQueueFailed()
  async onFailed(job, err) {
    this.logger.error(
      `Job task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} failed `,
      err,
    );

    // worker内部POST单个异常会通过report上报，这里处理的是整体的结果
    if (job?.data?.taskConfig) {
      await this.workerTasksDispatcherService.failTask(job?.data?.taskConfig);
    }
  }
  @OnQueueError()
  async onError(err) {
    this.logger.error(`Queue Error ${err}`, this.constructor.name);
  }
}
