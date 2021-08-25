import { Injectable } from '@nestjs/common';

import { MetaWorker } from '../../types/metaWorker';
import { TemplateLogicService } from '../theme/template/logicService';
import { SiteConfigLogicService } from './config/logicService';

@Injectable()
export class SiteService {
  constructor(
    private readonly siteConfigService: SiteConfigLogicService,
    private readonly templateService: TemplateLogicService,
  ) {}

  async generateMetaWorkerSiteInfo(
    configId: number,
  ): Promise<
    MetaWorker.Info.CmsSiteInfo &
      MetaWorker.Info.CmsSiteConfig &
      MetaWorker.Info.Template
  > {
    const config = await this.siteConfigService.getSiteConfigById(configId);
    const { language, timezone, domain, templateId } = config;
    const siteConfig: MetaWorker.Info.CmsSiteConfig = {
      configId,
      language,
      timezone,
      domain,
    };

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

    const template = await this.templateService.getTemplateById(templateId);
    const {
      templateName,
      repoUrl,
      branchName: templateBranchName,
      templateType,
    } = template;
    const templateInfo: MetaWorker.Info.Template = {
      templateName,
      templateRepoUrl: repoUrl,
      templateBranchName,
      templateType,
    };

    return { ...siteInfo, ...siteConfig, ...templateInfo };
  }
}
