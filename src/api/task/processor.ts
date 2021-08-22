import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BullProcessorType, BullQueueType } from 'src/constants';

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
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.verbose(
      `Processing job ${job.id} of type ${job.name}`,
      GitWorkerProcessor.name,
    );
  }
}
