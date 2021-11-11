import { MetaWorker } from '@metaio/worker-model';
import {
  Inject,
  Injectable,
  LoggerService,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { MetaMicroserviceClient, TaskEvent } from '../../../constants';
import { UCenterJWTPayload } from '../../../types';
@Injectable()
export class MetaNetworkService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(MetaMicroserviceClient.Network)
    private readonly networkClient: ClientProxy,
  ) {}

  @OnEvent(TaskEvent.SITE_PUBLISHED)
  async handleSitePublished(event: {
    publishConfig: MetaWorker.Configs.PublishConfig;
    user: Partial<UCenterJWTPayload>;
  }) {
    const { publishConfig, user } = event;
    this.notifyMetaSpaceSiteCreated({
      ...publishConfig.site,
      userId: user.id,
    });
  }

  async notifyMetaSpaceSiteCreated(
    site: MetaWorker.Info.CmsSiteInfo &
      MetaWorker.Info.CmsSiteConfig & { userId: number },
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
