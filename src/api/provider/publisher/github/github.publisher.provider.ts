import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Octokit } from 'octokit';

import {
  PublisherProvider,
  registerPublisherProvider,
} from '../publisher.provider';

@Injectable()
export class GitHubPublisherProvider implements PublisherProvider {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    registerPublisherProvider(MetaWorker.Enums.PublisherType.GITHUB, this);
  }
  private readonly octokit: Octokit;
  getTargetOriginDomain(
    publishConfig: MetaWorker.Configs.PublishConfig,
  ): string {
    return `${publishConfig.git.publisher.username}.github.io`;
  }
  async updateDomainName(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
      site,
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });

    let siteInfo;
    let isDnsRecordValid = false;
    try {
      const dnsHealthResponse = await this.checkSiteDnsHealth(publishConfig);
      isDnsRecordValid =
        dnsHealthResponse.status &&
        dnsHealthResponse.data.domain === site.domain;
      siteInfo = (await this.getSiteInfo(publishConfig)).data;
    } catch (err) {
      await this.createSite(publishConfig);
    }

    // if (siteInfo.cname !== publishConfig.site.domain) {
    if (isDnsRecordValid) {
      const dataBase = {
        owner: publisher.username,
        repo: publisher.reponame,
        cname: site.domain,
      };
      let data;
      if (siteInfo.public) {
        data = dataBase;
      } else {
        data = {
          ...dataBase,
          public: true,
        };
      }
      this.logger.verbose(
        `update cname ${data.owner}.github.io/${data.repo} : ${data.cname}`,
        this.constructor.name,
      );
      await octokit.request('PUT /repos/{owner}/{repo}/pages', data);
    }
  }
  async getSiteInfo(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('GET /repos/{owner}/{repo}/pages', {
      owner: publisher.username,
      repo: publisher.reponame,
    });
  }
  async checkSiteDnsHealth(publishConfig: MetaWorker.Configs.PublishConfig) {
    const {
      git: { publisher },
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('GET /repos/{owner}/{repo}/pages/health', {
      owner: publisher.username,
      repo: publisher.reponame,
    });
  }
  async createSite(publishConfig: MetaWorker.Configs.PublishConfig) {
    this.logger.verbose(`Create site `, this.constructor.name);
    const {
      git: { publisher },
      publish,
    } = publishConfig;
    const octokit = new Octokit({
      auth: publisher.token,
    });
    return await octokit.request('POST /repos/{owner}/{repo}/pages', {
      owner: publisher.username,
      repo: publisher.reponame,
      source: {
        branch: publish.publishBranch,
        path: '/',
      },
      mediaType: {
        previews: ['switcheroo'],
      },
    });
  }
}
