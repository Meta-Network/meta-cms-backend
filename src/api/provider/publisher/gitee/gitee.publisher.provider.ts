import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import {
  PublisherProvider,
  registerPublisherProvider,
} from '../publisher.provider';

@Injectable()
export class GiteePublisherProvider implements PublisherProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    registerPublisherProvider(MetaWorker.Enums.PublisherType.GITEE, this);
  }
  getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return `${publishConfig.git.publisher.username}.github.io`;
  }
  updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    throw new Error('Method not implemented.');
  }
}
