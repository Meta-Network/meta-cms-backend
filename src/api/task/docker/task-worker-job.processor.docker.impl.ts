import { InternalServerErrorException, LoggerService } from '@nestjs/common';
import { Container } from 'dockerode';

import { TaskWorkerJobProcessor } from '../workers/task-worker-job.processor';
import { DockerTasksService } from './service';

export class TaskWorkerJobProcessorDockerImpl
  implements TaskWorkerJobProcessor
{
  constructor(
    protected readonly logger: LoggerService,
    private readonly dockerTasksService: DockerTasksService,
    private readonly image: string,
  ) {}
  async process(job) {
    const data = await this.dockerTasksService.runDockerContainer(
      this.image,
      job.id,
    );
    const output = data[0];
    const container = data[1] as Container;
    this.logger.log(
      `Task ${job.data.taskId} ${job.data.taskMethod} ${job.id} StatusCode: ${output.StatusCode}`,
      this.constructor.name,
    );
    await container.remove();
    if (output && output.StatusCode === 0) {
      return job.id;
    }
    throw new InternalServerErrorException(
      'Task Worker: Docker Runner Exception',
    );
  }
}
