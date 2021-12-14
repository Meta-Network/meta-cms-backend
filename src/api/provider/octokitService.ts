import { Inject, Injectable, LoggerService } from '@nestjs/common';
// import { PaginateInterface } from '@octokit/plugin-paginate-rest';
// import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
// import { RequestError } from '@octokit/request-error';
import { Endpoints, RequestParameters } from '@octokit/types';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Octokit } from 'octokit';

import { AccessDeniedException } from '../../exceptions';
import { CreateGitRepoResult } from '../../types';
import { AbstractGitService } from './abstractGitService';

// type OctokitInst = Octokit &
//   Api & {
//     paginate: PaginateInterface;
//   } & {
//     retry: {
//       retryRequest: (
//         error: RequestError,
//         retries: number,
//         retryAfter: number,
//       ) => RequestError;
//     };
//   };

@Injectable()
export class OctokitService extends AbstractGitService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  public async createGitRepo(
    token: string,
    userName: string,
    repoName: string,
    privateRepo = false,
  ): Promise<CreateGitRepoResult> {
    const octokit = new Octokit({ auth: token });
    // Login GitHub user
    const { data: authData } = await octokit.rest.users.getAuthenticated();
    if (!authData) {
      throw new AccessDeniedException("can not login GitHub with user's token");
    }
    if (userName !== authData.login) {
      throw new AccessDeniedException(
        `GitHub user ${authData.login} not match repo owner ${userName}`,
      );
    }
    this.logger.verbose(
      `Successful login github with ${authData.login}`,
      OctokitService.name,
    );

    try {
      // Check repo permissions
      this.logger.verbose(
        `Check user GitHub repo permissions`,
        OctokitService.name,
      );
      const { data: repoData } = await octokit.rest.repos.get({
        owner: userName,
        repo: repoName,
      });
      const { pull, push } = repoData?.permissions;
      // If no pull and push permissions, throw error
      if (!(pull && push)) {
        const msg = `Insufficient GitHub permissions, pull: ${pull}, push: ${push}`;
        this.logger.verbose(msg, OctokitService.name);
        throw new AccessDeniedException(msg);
      }

      try {
        // Get repo all commit count, if has, repo is not empty
        const { data: commitData } = await octokit.rest.repos.listCommits({
          owner: userName,
          repo: repoName,
        });
        this.logger.verbose(
          `Repo ${repoData.full_name} already exists, commit count: ${commitData.length}, size: ${repoData.size}, pull: ${pull} push: ${push}`,
          OctokitService.name,
        );
        return {
          status: true,
          empty: !commitData.length,
          permissions: repoData.permissions,
        };
      } catch (error) {
        // Repo is empty
        if (
          error.status === 409 ||
          error.message.includes('Git Repository is empty')
        ) {
          this.logger.verbose(
            `Repo ${repoData.full_name} already exists, but it is empty, size: ${repoData.size}, pull: ${pull} push: ${push}`,
            OctokitService.name,
          );
          return {
            status: true,
            empty: true,
            permissions: repoData.permissions,
          };
        }
        // throe other error
        throw error;
      }
    } catch (error) {
      // If `octokit.rest.repos.get` return 404, repo does not exists
      if (error.status === 404) {
        this.logger.verbose(
          `Repo ${userName}/${repoName} does not exists`,
          OctokitService.name,
        );
        // Create new repo
        const { data: repoData } =
          await octokit.rest.repos.createForAuthenticatedUser({
            name: repoName,
            private: privateRepo,
            auto_init: false,
          });
        const { pull, push } = repoData?.permissions;
        this.logger.verbose(
          `Repo ${repoData.full_name} created, size: ${repoData.size}, pull: ${pull} push: ${push}`,
          OctokitService.name,
        );
        return {
          status: true,
          empty: true,
          permissions: repoData.permissions,
        };
      }
      // throe other error
      throw error;
    }
  }

  public async getGitHubPagesSiteInfo(
    token: string,
    params: RequestParameters &
      Omit<
        Endpoints['GET /repos/{owner}/{repo}/pages']['parameters'],
        'baseUrl' | 'headers' | 'mediaType'
      >,
  ) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.getPages(params);
    return data;
  }

  public async getGitHubPagesHealthCheck(
    token: string,
    params: RequestParameters &
      Omit<
        Endpoints['GET /repos/{owner}/{repo}/pages/health']['parameters'],
        'baseUrl' | 'headers' | 'mediaType'
      >,
  ) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.getPagesHealthCheck(params);
    return data;
  }

  public async createGitHubPagesSite(
    token: string,
    params: RequestParameters &
      Omit<
        Endpoints['POST /repos/{owner}/{repo}/pages']['parameters'],
        'baseUrl' | 'headers' | 'mediaType'
      >,
  ) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.createPagesSite(params);
    return data;
  }

  public async updateInfoAboutGitHubPagesSite(
    token: string,
    params: RequestParameters &
      Omit<
        Endpoints['PUT /repos/{owner}/{repo}/pages']['parameters'],
        'baseUrl' | 'headers' | 'mediaType'
      >,
  ) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.updateInformationAboutPagesSite(
      params,
    );
    return data;
  }
}
