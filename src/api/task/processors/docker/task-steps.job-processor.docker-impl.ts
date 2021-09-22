import { InternalServerErrorException, LoggerService } from '@nestjs/common';
import { Container } from 'dockerode';

import { TaskStepsJobProcessor } from '../task-steps.job-processor';
import { DockerProcessorsService } from './docker-processors.service';

export class TaskWorkerJobProcessorDockerImpl implements TaskStepsJobProcessor {
  constructor(
    protected readonly logger: LoggerService,
    private readonly dockerTasksService: DockerProcessorsService,
    private readonly appName: string,
    private readonly image: string,
  ) {}
  async process(job) {
    const data = await this.dockerTasksService.runDockerContainer(
      this.appName,
      this.image,
      job.id,
    );
    const output = data[0];
    const container = data[1] as Container;
    this.logger.log(
      `Task ${job.data.task.taskId} step ${job.data.task.taskMethod} ${job.id} StatusCode: ${output.StatusCode}`,
      this.constructor.name,
    );
    await container.remove();
    if (output && output.StatusCode === 0) {
      return job.id;
    }
    throw new InternalServerErrorException(
      'Task step processor: Docker Exception',
    );
  }
}
