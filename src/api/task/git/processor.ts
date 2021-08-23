import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
  OnQueueProgress,
  OnQueueStalled,
  OnQueueWaiting,
  Process,
  Processor,
} from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { BullProcessorType, BullQueueType } from '../../../constants';

@Processor(BullQueueType.WORKER_GIT)
export class GitWorkerProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Process(BullProcessorType.CREATE_SITE)
  handleCreateSiteProcess(job: Job) {
    this.logger.verbose(
      `Processing job ${job.id} of type ${job.name}`,
      GitWorkerProcessor.name,
    );
    // Run docker
  }

  @OnQueueWaiting()
  onWaiting(jobId: number | string) {
    this.logger.verbose(`Job ${jobId} is waiting`, GitWorkerProcessor.name);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is activated`,
      GitWorkerProcessor.name,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is stalled`,
      GitWorkerProcessor.name,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is progressing, progress ${progress}`,
      GitWorkerProcessor.name,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is completed`,
      GitWorkerProcessor.name,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is failed, error ${err}`,
      GitWorkerProcessor.name,
    );
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.verbose(
      `A job can not complete cause has error ${error}`,
      GitWorkerProcessor.name,
    );
  }

  // @OnQueuePaused()

  // @OnQueueResumed()

  // @OnQueueCleaned()

  // @OnQueueRemoved()
}
