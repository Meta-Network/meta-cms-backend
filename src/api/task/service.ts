import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BullQueueType } from 'src/constants';
import { TaskConfig } from 'src/types/worker';

@Injectable()
export class TasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue(BullQueueType.WORKER_GIT)
    private readonly gitQueue: Queue<TaskConfig>,
  ) {}

  async addTaskQueue(cfg: TaskConfig) {
    const job = await this.gitQueue.add(cfg);
    this.logger.verbose(
      `Successfully add task queue, jobId: ${
        job.id
      }, jobOptions: ${JSON.stringify(job.opts)}, jobData: ${JSON.stringify(
        job.data,
      )}`,
      TasksService.name,
    );
  }
}
