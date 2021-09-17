import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class DockerTasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.docker = new Docker();
  }

  private readonly docker: Docker;

  async startDockerContainer(
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Promise<Container> {
    const _container = await this.docker.createContainer(
      this.buildCreateDockerOptions(image, secret, options),
    );
    this.logger.verbose(
      `Create docker ${_container.id} with image ${image}`,
      DockerTasksService.name,
    );
    const _start = await _container.start();
    this.logger.verbose(
      `Start docker ${_container.id}: ${_start}`,
      DockerTasksService.name,
    );
    return _container;
  }

  async runDockerContainer(
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Promise<Container> {
    this.logger.verbose(
      `Run docker with image ${image}`,
      DockerTasksService.name,
    );
    // https://github.com/apocas/dockerode#equivalent-of-docker-run-in-dockerode
    return await this.docker.run(
      image,
      ['node', 'dist/main.js'],
      process.stdout,
      this.buildCreateDockerOptions(image, secret, options),
    );
  }

  buildCreateDockerOptions(
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Docker.ContainerCreateOptions {
    return {
      ...options,
      Image: image,
      Volumes: {
        '/tmp': {},
      },
      HostConfig: {
        Binds: [
          `${this.configService.get<string>('task.docker.volumes.tmp')}:/tmp`,
        ],
      },
      name: secret,
      Env: [
        // `NODE_ENV=${process.env.NODE_ENV}`,
        `WORKER_SECRET=${secret}`,
        `BE_HOST=${this.configService.get<string>(
          'task.docker.env.backend.host',
        )}`,
        `BE_PORT=${this.configService.get<number>(
          'task.docker.env.backend.port',
        )}`,
        `LOKI_URL=${this.configService.get<string>(
          'task.docker.env.loki.url',
        )}`,
      ],
    };
  }
}
