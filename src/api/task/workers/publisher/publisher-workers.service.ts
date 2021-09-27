import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { getPublisherProvider } from './provider/publisher.provider';

@Injectable()
export class PublisherWorkersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return getPublisherProvider(
      publishConfig.site.publisherType,
    ).getTargetOriginDomain(publishConfig);
  }
  async updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    await getPublisherProvider(
      publishConfig.site.publisherType,
    ).updateDomainName(publishConfig);
  }
}
