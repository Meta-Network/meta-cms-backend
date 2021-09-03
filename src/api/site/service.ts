import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { TemplateLogicService } from '../theme/template/logicService';
import { SiteConfigLogicService } from './config/logicService';

type MetaWorkerSiteInfo = MetaWorker.Info.CmsSiteInfo &
  MetaWorker.Info.CmsSiteConfig &
  MetaWorker.Info.Template;

type GenerateMetaWorkerSiteInfo = {
  siteInfo: MetaWorkerSiteInfo;
  storage: {
    sType: MetaWorker.Enums.StorageType;
    sId: number;
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
    uid: number,
    cid: number,
  ): Promise<GenerateMetaWorkerSiteInfo> {
    this.logger.verbose(`Generate meta worker site info`, SiteService.name);

    this.logger.verbose(
      `Get site config from SiteConfigLogicService`,
      SiteService.name,
    );
    const config = await this.siteConfigService.validateSiteConfigUserId(
      cid,
      uid,
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
    const _siteInfo: MetaWorker.Info.CmsSiteInfo = {
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
    const {
      templateName,
      repoUrl,
      branchName: templateBranchName,
      templateType,
      themeName,
    } = template;
    const templateInfo: MetaWorker.Info.Template = {
      templateName,
      templateRepoUrl: repoUrl,
      templateBranchName,
      templateType,
      themeName,
    };

    const siteInfo = { ..._siteInfo, ...siteConfig, ...templateInfo };

    return {
      siteInfo,
      storage: { sId: config.storeProviderId, sType: config.storeType },
    };
  }
}
