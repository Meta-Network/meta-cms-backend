import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TaskStepsJobProcessor } from '../task-steps.job-processor';

export class TaskStepsJobProcessorMockImpl implements TaskStepsJobProcessor {
  constructor(
    protected readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}
  async process(job) {
    setTimeout(() => {
      job.progress(
        this.configService.get<number>('task.processor.mock.progress[0].value'),
      );
      this.logger.debug(
        `Executing task ${job.data.task.taskId} method ${job.data.task.taskMethod}`,
        this.constructor.name,
      );
    }, this.configService.get<number>('task.processor.mock.progress[0].timeout'));
    setTimeout(
      () =>
        job.progress(
          this.configService.get<number>(
            'task.processor.mock.progress[1].value',
          ),
        ),
      this.configService.get<number>('task.processor.mock.progress[1].timeout'),
    );
    setTimeout(
      () =>
        job.progress(
          this.configService.get<number>(
            'task.processor.mock.progress[2].value',
          ),
        ),
      this.configService.get<number>('task.processor.mock.progress[2].timeout'),
    );
    return await new Promise((resolve, reject) => {
      const rnd = Math.random();

      setTimeout(
        () =>
          rnd <
          this.configService.get<number>('task.processor.mock.success-rate')
            ? resolve(job.id)
            : reject(new Error('Random Error')),
        this.configService.get<number>('task.processor.mock.timeout'),
      );
    });
  }
}
