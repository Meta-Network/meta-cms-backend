import {
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  WorkerTasksJobDetail,
  WorkerTasksJobProcessor,
} from '../worker-tasks.job-processor';

export interface DockerProcessorOptions {
  workerName: string;
  workerTaskId: string;
  image: string;
  secret: string;
}

@Injectable()
export class DockerProcessorsService implements WorkerTasksJobProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    [
      'pipeline.processor.docker.image',
      'pipeline.processor.docker.volumes.tmp',
      'pipeline.processor.docker.env.logging.debug',
      'pipeline.processor.docker.env.logging.level',
      'pipeline.processor.docker.env.backend.url',
      'pipeline.processor.docker.env.loki.url',
    ].forEach((configKey) => {
      const configValue = this.configService.get(configKey);
      if (configValue === undefined || configValue === null) {
        throw new Error(`No config: ${configKey}`);
      }
    });

    this.docker = new Docker();
  }

  private readonly docker: Docker;

  async process(job: Job<WorkerTasksJobDetail>) {
    //TODO image 根据 template 来选择
    const image = this.getImage(job);
    const data = await this.runDockerContainer({
      workerName: job.data.workerName,
      workerTaskId: job.data.taskConfig.task.taskId,
      image,
      secret: job.id.toString(),
    });
    const output = data[0];
    const container = data[1] as Container;
    this.logger.log(
      `Task ${job.data.taskConfig.task.taskId} method ${job.data.taskConfig.task.taskMethod} ${job.data.workerName}:${job.id} StatusCode: ${output.StatusCode}`,
      this.constructor.name,
    );
    await container.remove();
    if (output && output.StatusCode === 0) {
      return;
    }
    throw new InternalServerErrorException(
      output,
      'Task processor: Docker Exception',
    );
  }
  getImage(job: Job<WorkerTasksJobDetail>): string {
    return this.configService.get<string>(`pipeline.processor.docker.image`);
  }

  async startDockerContainer(
    processorOptions: DockerProcessorOptions,
    containerCreateOptions?: ContainerCreateOptions,
  ): Promise<Container> {
    const _container = await this.docker.createContainer(
      this.buildCreateDockerOptions(processorOptions, containerCreateOptions),
    );

    const _start = await _container.start();
    this.logger.verbose(
      `Start docker ${_container.id}: ${_start}`,
      DockerProcessorsService.name,
    );
    return _container;
  }

  async runDockerContainer(
    processorOptions: DockerProcessorOptions,
    containerCreateOptions?: ContainerCreateOptions,
  ): Promise<Container> {
    const { image } = processorOptions;

    // https://github.com/apocas/dockerode#equivalent-of-docker-run-in-dockerode
    const options = this.buildCreateDockerOptions(
      processorOptions,
      containerCreateOptions,
    );
    this.logger.verbose(
      `Run docker with image ${image} options : ${JSON.stringify(options)}`,
      DockerProcessorsService.name,
    );
    return await this.docker.run(image, [], process.stdout, options);
  }

  buildCreateDockerOptions(
    processorOptions: DockerProcessorOptions,
    options?: ContainerCreateOptions,
  ): Docker.ContainerCreateOptions {
    const { workerName, workerTaskId, image, secret } = processorOptions;
    const hostTmpDir = this.configService.get<string>(
      'pipeline.processor.docker.volumes.tmp',
    );
    const debug = this.configService.get<string>(
      'pipeline.processor.docker.env.logging.debug',
    );
    const logLevel = this.configService.get<string>(
      'pipeline.processor.docker.env.logging.level',
    );
    const backendUrl = this.configService.get<string>(
      'pipeline.processor.docker.env.backend.url',
    );
    const lokiUrl = this.configService.get<string>(
      'pipeline.processor.docker.env.loki.url',
    );
    const env = [
      // `NODE_ENV=${process.env.NODE_ENV}`,
      `DEBUG=${debug}`,
      `LOG_LEVEL=${logLevel}`,
      `NO_COLOR=true`,
      `WORKER_SECRET=${secret}`,
      `WORKER_NAME=${workerName}`,
      `WORKER_TASK_ID=${workerTaskId}`,
      `WORKER_BACKEND_URL=${backendUrl}`,
      `WORKER_LOKI_URL=${lokiUrl}`,
    ];
    return {
      ...options,
      Image: image,
      Volumes: {
        '/tmp': {},
      },
      HostConfig: {
        Binds: [`${hostTmpDir}:/tmp`],
      },
      name: secret,
      Env: env,
    };
  }
}
