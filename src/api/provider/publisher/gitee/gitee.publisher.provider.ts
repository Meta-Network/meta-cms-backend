import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GitPublisherProviderEntity } from '../../../../entities/provider/publisher/git.entity';
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

  public getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    const domain = `${publishConfig.git.publisher.username}.gitee.io`;
    return domain.toLowerCase();
  }

  public getTargetOriginDomainByPublisherConfig(
    config: GitPublisherProviderEntity,
  ): string {
    const domain = `${config.userName}.gitee.io`;
    return domain.toLowerCase();
  }

  public updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    // Do nothing.Only Gitee Pages Pro supports custom domain
  }
}
