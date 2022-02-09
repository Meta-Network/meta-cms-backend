import { MetaWorker } from '@metaio/worker-model2';
import { Injectable } from '@nestjs/common';

import { UCenterJWTPayload, UCenterUser } from '../../types';
import { SiteStatus } from '../../types/enum';
import { SiteService } from './service';

type MetaWorkerSiteInfo = MetaWorker.Info.CmsSiteInfo &
  MetaWorker.Info.CmsSiteConfig;

type GenerateMetaWorkerSiteInfo = {
  site: MetaWorkerSiteInfo;
  template: MetaWorker.Info.Template;
  theme: MetaWorker.Info.Theme;
  storage: {
    storageType: MetaWorker.Enums.StorageType;
    storageProviderId: number;
  };
  publisher: {
    publisherType: MetaWorker.Enums.PublisherType;
    publisherProviderId: number;
  };
  metaSpacePrefix: string;
};

@Injectable()
export class WorkerModel2SiteService {
  constructor(private readonly siteService: SiteService) {}

  async generateMetaWorkerSiteInfo(
    user: Partial<UCenterUser>,
    siteConfigId: number,
    validSiteStatus?: SiteStatus[],
  ): Promise<GenerateMetaWorkerSiteInfo> {
    const workerModel1SiteInfo =
      await this.siteService.generateMetaWorkerSiteInfo(
        user,
        siteConfigId,
        validSiteStatus,
      );
    const template = workerModel1SiteInfo.template;
    return {
      ...workerModel1SiteInfo,
      template: {
        templateBranch: template.templateBranchName,
        templateName: template.templateName,
        templateType: template.templateType,
        templateRepo: template.templateRepoUrl,
      },
    };
  }
}
