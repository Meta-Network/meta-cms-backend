/* eslint-disable @typescript-eslint/no-namespace */
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';

import { AccessDeniedException } from '../../exceptions';
import {
  CreateGitRepoResult,
  GetGitTreeResult,
  GitBlobInfo,
} from '../../types';
import { AbstractGitService } from './abstractGitService';

export declare namespace Gitee {
  export namespace Users {
    export type User = {
      id: number;
      login: string;
      name: string;
      avatar_url: string;
      url: string;
      html_url: string;
      remark: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      member_role: string;
    };

    export type Info = User & {
      bio: string;
      blog: string;
      created_at: string;
      email: string;
      followers: number;
      following: number;
      public_gists: number;
      public_repos: number;
      stared: number;
      updated_at: string;
      watched: number;
      weibo: string;
    };
  }

  export namespace Repositories {
    export type Namespace = {
      id: number;
      type: string;
      name: string;
      path: string;
      html_url: string;
    };

    export type Permission = {
      pull: boolean;
      push: boolean;
      admin: boolean;
    };

    export type Info = {
      id: number;
      full_name: string;
      human_name: string;
      url: string;
      path: string;
      name: string;
      description: string;
      private: boolean;
      public: boolean;
      internal: boolean;
      fork: boolean;
      html_url: string;
      ssh_url: string;
      forks_url: string;
      keys_url: string;
      collaborators_url: string;
      hooks_url: string;
      branches_url: string;
      tags_url: string;
      blobs_url: string;
      stargazers_url: string;
      contributors_url: string;
      commits_url: string;
      comments_url: string;
      issue_comment_url: string;
      issues_url: string;
      pulls_url: string;
      milestones_url: string;
      notifications_url: string;
      labels_url: string;
      releases_url: string;
      recommend: boolean;
      gvp: boolean;
      homepage: string;
      language: string;
      forks_count: number;
      stargazers_count: number;
      watchers_count: number;
      open_issues_count: number;
      default_branch: string;
      has_issues: boolean;
      has_wiki: boolean;
      issue_comment: string;
      can_comment: boolean;
      pull_requests_enabled: boolean;
      has_page: boolean;
      license: string;
      outsourced: boolean;
      project_creator: string;
      pushed_at: string;
      created_at: string;
      updated_at: string;
      parent: string;
      paas: string;
      stared: boolean;
      watched: boolean;
      relation: string;
      assignees_number: number;
      testers_number: number;
      status: string;
      empty_repo: boolean;
      namespace: Namespace;
      permission: Permission;
      owner: Users.User;
      assigner: Users.User;
    };
  }
}

export type CreateRepoOptions = {
  description: string;
  homepage: string;
  has_issues: boolean;
  has_wiki: boolean;
  can_comment: boolean;
  auto_init: boolean;
  gitignore_template: string;
  license_template: string;
  path: string;
  private: boolean;
};

@Injectable()
export class GiteeService extends AbstractGitService {
  public constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.baseUrl = 'https://gitee.com/api/v5';
  }

  private readonly baseUrl: string;

  private async getAuthenticatedUser(token: string): Promise<Gitee.Users.Info> {
    const res = this.httpService.get<Gitee.Users.Info>(`${this.baseUrl}/user`, {
      params: {
        access_token: token,
      },
    });
    const { data } = await lastValueFrom(res);
    return data;
  }

  private async getOneRepo(
    token: string,
    owner: string,
    repo: string,
  ): Promise<Gitee.Repositories.Info> {
    const res = this.httpService.get<Gitee.Repositories.Info>(
      `${this.baseUrl}/repos/${owner}/${repo}`,
      {
        params: {
          access_token: token,
        },
      },
    );
    const { data } = await lastValueFrom(res);
    return data;
  }

  private async createForAuthenticatedUser(
    token: string,
    name: string,
    options?: Partial<CreateRepoOptions>,
  ): Promise<Gitee.Repositories.Info> {
    const defaultOptions: Partial<CreateRepoOptions> = {
      has_issues: true,
      has_wiki: true,
      can_comment: true,
    };
    const postData = {
      access_token: token,
      name,
      ...defaultOptions,
      ...options,
    };
    const res = this.httpService.post<Gitee.Repositories.Info>(
      `${this.baseUrl}/user/repos`,
      postData,
    );
    const { data } = await lastValueFrom(res);
    return data;
  }

  public async createGitRepo(
    token: string,
    userName: string,
    repoName: string,
    privateRepo = false,
  ): Promise<CreateGitRepoResult> {
    // Login Gitee user
    const authData = await this.getAuthenticatedUser(token);
    if (!authData) {
      throw new AccessDeniedException("can not login Gitee with user's token");
    }
    if (userName !== authData.login) {
      throw new AccessDeniedException(
        `Gitee user ${authData.login} not match repo owner ${userName}`,
      );
    }
    this.logger.verbose(
      `Successful login Gitee with ${authData.login}`,
      GiteeService.name,
    );

    try {
      // Check repo permissions
      this.logger.verbose(
        `Check user Gitee repo permissions`,
        GiteeService.name,
      );
      const repoData = await this.getOneRepo(token, userName, repoName);
      const { pull, push } = repoData?.permission;
      // If no pull and push permissions, throw error
      if (!(pull && push)) {
        const msg = `Insufficient Gitee permissions, pull: ${pull}, push: ${push}`;
        this.logger.verbose(msg, GiteeService.name);
        throw new AccessDeniedException(msg);
      }

      return {
        status: true,
        empty: repoData.empty_repo,
        permissions: repoData.permission,
      };
    } catch (error) {
      // Repo does not exists
      if (error.status === 404) {
        this.logger.verbose(
          `Repo ${userName}/${repoName} does not exists`,
          GiteeService.name,
        );
        // Create new repo
        const repoData = await this.createForAuthenticatedUser(
          token,
          repoName,
          { private: privateRepo },
        );
        const { pull, push } = repoData?.permission;
        this.logger.verbose(
          `Repo ${repoData.full_name} created, pull: ${pull} push: ${push}`,
          GiteeService.name,
        );
        return {
          status: true,
          empty: repoData.empty_repo,
          permissions: repoData.permission,
        };
      }
      // throe other error
      throw error;
    }
  }

  public async getGitTree(
    token: string,
    userName: string,
    repoName: string,
    branchOrSHA: string,
    recursive = false,
  ): Promise<GetGitTreeResult> {
    const res = this.httpService.get<GetGitTreeResult>(
      `${this.baseUrl}/repos/${userName}/${repoName}/git/trees/${branchOrSHA}`,
      {
        params: {
          access_token: token,
          recursive: Number(recursive).toString(),
        },
      },
    );
    const { data } = await lastValueFrom(res);
    return data;
  }

  public async getGitBlob(
    token: string,
    userName: string,
    repoName: string,
    blobSHA: string,
  ): Promise<GitBlobInfo> {
    const res = this.httpService.get<GitBlobInfo>(
      `${this.baseUrl}/repos/${userName}/${repoName}/git/blobs/${blobSHA}`,
      {
        params: {
          access_token: token,
        },
      },
    );
    const { data } = await lastValueFrom(res);
    return data;
  }
}
