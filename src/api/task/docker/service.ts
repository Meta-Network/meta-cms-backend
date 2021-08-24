import { Inject, Injectable, LoggerService } from '@nestjs/common';
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class DockerTasksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.docker = new Docker();
  }

  private readonly docker: Docker;

  async startDockerContainer(
    image: string,
    secret: string,
    options?: ContainerCreateOptions,
  ): Promise<Container> {
    const _container = await this.docker.createContainer({
      ...options,
      Image: image,
      name: secret,
      Env: [`WORKER_SECRET=${secret}`],
    });
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
}
