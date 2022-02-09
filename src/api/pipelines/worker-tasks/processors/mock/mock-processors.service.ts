import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  WorkerTasksJobDetail,
  WorkerTasksJobProcessor,
} from '../worker-tasks.job-processor';

@Injectable()
export class MockProcessorsService implements WorkerTasksJobProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    protected readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}
  async process(job: Job<WorkerTasksJobDetail>) {
    setTimeout(() => {
      job.progress(
        this.configService.get<number>(
          'pipeline.processor.mock.progress[0].value',
        ),
      );
      this.logger.debug(
        `Executing task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id}`,
        this.constructor.name,
      );
    }, this.configService.get<number>('pipeline.processor.mock.progress[0].timeout'));
    setTimeout(
      () =>
        job.progress(
          this.configService.get<number>(
            'pipeline.processor.mock.progress[1].value',
          ),
        ),
      this.configService.get<number>(
        'pipeline.processor.mock.progress[1].timeout',
      ),
    );
    setTimeout(
      () =>
        job.progress(
          this.configService.get<number>(
            'pipeline.processor.mock.progress[2].value',
          ),
        ),
      this.configService.get<number>(
        'pipeline.processor.mock.progress[2].timeout',
      ),
    );
    return await new Promise((resolve, reject) => {
      const rnd = Math.random();

      setTimeout(
        () =>
          rnd <
          this.configService.get<number>('pipeline.processor.mock.successRate')
            ? resolve(job.id)
            : reject(new Error('Random Error')),
        this.configService.get<number>('pipeline.processor.mock.timeout'),
      );
    });
  }
}
