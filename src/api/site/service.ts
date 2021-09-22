import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TemplateLogicService } from '../theme/template/logicService';
import { SiteConfigLogicService } from './config/logicService';

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
};

@Injectable()
export class SiteService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly siteConfigService: SiteConfigLogicService,
    private readonly templateService: TemplateLogicService,
  ) {}

  async generateMetaWorkerSiteInfo(
    userId: number,
    siteConfigId: number,
  ): Promise<GenerateMetaWorkerSiteInfo> {
    this.logger.verbose(`Generate meta worker site info`, SiteService.name);

    this.logger.verbose(
      `Get site config from SiteConfigLogicService`,
      SiteService.name,
    );
    const config = await this.siteConfigService.validateSiteConfigUserId(
      siteConfigId,
      userId,
    );
    const { language, timezone, domain, templateId } = config;
    const siteConfig: MetaWorker.Info.CmsSiteConfig = {
      configId: config.id,
      language,
      timezone,
      domain,
    };

    this.logger.verbose(
      `Get site info fron site config relations`,
      SiteService.name,
    );
    const { title, subtitle, description, author, keywords, favicon } =
      config.siteInfo;
    const siteInfo: MetaWorker.Info.CmsSiteInfo = {
      title,
      subtitle,
      description,
      author,
      keywords,
      favicon,
    };

    this.logger.verbose(
      `Get template info fron TemplateLogicService`,
      SiteService.name,
    );
    const template = await this.templateService.getTemplateById(templateId);
    // console.log(`template`, template);
    const { templateName, templateRepo, templateBranch, templateType, theme } =
      template;
    const templateInfo: MetaWorker.Info.Template = {
      templateName,
      templateRepoUrl: templateRepo,
      templateBranchName: templateBranch,
      templateType,
    };
    // console.log(`theme`, theme);

    return {
      site: { ...siteInfo, ...siteConfig },
      template: templateInfo,
      theme,
      storage: {
        storageProviderId: config.storeProviderId,
        storageType: config.storeType,
      },
    };
  }
}
