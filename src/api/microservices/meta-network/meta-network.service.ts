import { MetaWorker } from '@metaio/worker-model';
import { Inject, LoggerService, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { MetaMicroserviceClient } from '../../../constants';

export class MetaNetworkService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.Network)
    private readonly networkClient: ClientProxy,
  ) {}

  async notifyMetaSpaceSiteCreated(
    site: MetaWorker.Info.CmsSiteInfo & MetaWorker.Info.CmsSiteConfig,
  ) {
    this.logger.verbose(
      `Notify site created ${JSON.stringify(site)} `,
      this.constructor.name,
    );
    this.networkClient.emit('meta.space.site.created', site);
  }

  async onApplicationBootstrap() {
    await this.networkClient.connect();
    this.logger.verbose(
      `Connect Network microservice client`,
      this.constructor.name,
    );
  }
}
