import { MetaWorker } from '@metaio/worker-model';
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
import { DockerTasksService } from '../docker/service';

@Processor(BullQueueType.WORKER_GIT)
export class GitWorkerTaskProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly docker: DockerTasksService,
  ) {}

  @Process(BullProcessorType.CREATE_SITE)
  async handleCreateSiteProcess(
    job: Job<MetaWorker.Configs.GitWorkerTaskConfig>,
  ) {
    const { taskMethod } = job.data;
    if (taskMethod === MetaWorker.Enums.TaskMethod.CREATE_REPO_FROM_TEMPLATE) {
      this.logger.verbose(
        `Processing job ${job.id} of type ${job.name}`,
        GitWorkerTaskProcessor.name,
      );
      // Run docker
      await this.docker.startDockerContainer(
        'meta-cms-worker-git',
        job.data.taskId,
      );
    }
  }

  @OnQueueWaiting()
  onWaiting(jobId: number | string) {
    this.logger.verbose(`Job ${jobId} is waiting`, GitWorkerTaskProcessor.name);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is activated`,
      GitWorkerTaskProcessor.name,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is stalled`,
      GitWorkerTaskProcessor.name,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is progressing, progress ${progress}`,
      GitWorkerTaskProcessor.name,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is completed`,
      GitWorkerTaskProcessor.name,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.verbose(
      `Job ${job.id} of type ${job.name} is failed, error ${err}`,
      GitWorkerTaskProcessor.name,
    );
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.verbose(
      `A job can not complete cause has error ${error}`,
      GitWorkerTaskProcessor.name,
    );
  }

  // @OnQueuePaused()

  // @OnQueueResumed()

  // @OnQueueCleaned()

  // @OnQueueRemoved()
}
