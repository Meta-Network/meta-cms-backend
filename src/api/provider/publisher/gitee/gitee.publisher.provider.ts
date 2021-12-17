import { MetaWorker } from '@metaio/worker-model';
import { Injectable } from '@nestjs/common';

import { GitPublisherProviderEntity } from '../../../../entities/provider/publisher/git.entity';
import {
  PublisherProvider,
  registerPublisherProvider,
} from '../publisher.provider';

@Injectable()
export class GiteePublisherProvider implements PublisherProvider {
  constructor() {
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
