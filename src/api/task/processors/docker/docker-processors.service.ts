import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class DockerProcessorsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.docker = new Docker();
  }

  private readonly docker: Docker;

  async startDockerContainer(
    appName: string,
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Promise<Container> {
    const _container = await this.docker.createContainer(
      this.buildCreateDockerOptions(appName, image, secret, options),
    );
    this.logger.verbose(
      `Create docker ${_container.id} with image ${image}`,
      DockerProcessorsService.name,
    );
    const _start = await _container.start();
    this.logger.verbose(
      `Start docker ${_container.id}: ${_start}`,
      DockerProcessorsService.name,
    );
    return _container;
  }

  async runDockerContainer(
    appName: string,
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Promise<Container> {
    this.logger.verbose(
      `Run docker with image ${image}`,
      DockerProcessorsService.name,
    );
    // https://github.com/apocas/dockerode#equivalent-of-docker-run-in-dockerode
    return await this.docker.run(
      image,
      ['node', 'dist/main.js'],
      process.stdout,
      this.buildCreateDockerOptions(appName, image, secret, options),
    );
  }

  buildCreateDockerOptions(
    appName: string,
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
          `${this.configService.get<string>(
            'task.processor.docker.volumes.tmp',
          )}:/tmp`,
        ],
      },
      name: secret,
      Env: [
        // `NODE_ENV=${process.env.NODE_ENV}`,
        'DEBUG=debug',
        `WORKER_SECRET=${secret}`,
        `WORKER_7ZIP_BIN_NAME=${this.configService.get<string>(
          'task.processor.docker.env.7zip.bin-name',
        )}`,
        `WORKER_APP_NAME=${appName}`,
        `WORKER_BACKEND_URL=${this.configService.get<string>(
          'task.processor.docker.env.backend.url',
        )}`,
        `WORKER_LOKI_URL=${this.configService.get<string>(
          'task.processor.docker.env.loki.url',
        )}`,
      ],
    };
  }
}
