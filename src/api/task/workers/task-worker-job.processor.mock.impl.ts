import { LoggerService } from '@nestjs/common';

export class TaskWorkerJobProcessorMockImpl {
  constructor(protected readonly logger: LoggerService) {}
  async process(job) {
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
}
