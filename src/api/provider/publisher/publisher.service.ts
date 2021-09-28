import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { ValidationException } from '../../../exceptions';
import { GenerateMetaWorkerGitInfo } from '../../../types';
import { getPublisherProvider } from './publisher.provider';

const publisherServiceMap = {};
export function registerSpecificPublisherService(
  publisherType: MetaWorker.Enums.PublisherType,
  publisherProvider,
) {
  publisherServiceMap[publisherType] = publisherProvider;
  console.log(`Register publisher service: ${publisherType}`);
}
export function getSpecificPublisherService(
  publisherType: MetaWorker.Enums.PublisherType,
): SpecificPublisherService {
  // console.log(publisherType, publisherServiceMap);
  const instance = publisherServiceMap[publisherType];
  if (!instance) {
    throw new ValidationException('Invalid publisher type');
  }
  return instance;
}
export interface SpecificPublisherService {
  generateMetaWorkerGitInfo(
    userId,
    publisherProviderId,
  ): GenerateMetaWorkerGitInfo | Promise<GenerateMetaWorkerGitInfo>;
}

@Injectable()
export class PublisherService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  getTargetOriginDomain(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return getPublisherProvider(publisherType).getTargetOriginDomain(
      publishConfig,
    );
  }
  async updateDomainName(
    publisherType: MetaWorker.Enums.PublisherType,
    publishConfig: MetaWorker.Configs.PublishConfig,
  ) {
    await getPublisherProvider(publisherType).updateDomainName(publishConfig);
  }

  async generateMetaWorkerGitInfo(
    publisherType: MetaWorker.Enums.PublisherType,
    userId: number,
    publisherProviderId: number,
  ): Promise<GenerateMetaWorkerGitInfo> {
    if (publisherType === MetaWorker.Enums.PublisherType.GITHUB) {
      return await getSpecificPublisherService(
        publisherType,
      ).generateMetaWorkerGitInfo(userId, publisherProviderId);
    }
  }
}
