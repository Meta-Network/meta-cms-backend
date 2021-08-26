/* eslint-disable @typescript-eslint/no-namespace */
export namespace MetaWorker {
  export namespace Enums {
    export enum TemplateType {
      HEXO = 'HEXO',
    }

    enum GitServiceEnum {
      GITHUB = 'GITHUB',
      GITEE = 'GITEE',
    }
    export type GitServiceType = GitServiceEnum;
    export const GitServiceType = GitServiceEnum;

    enum DataProcessEnum {}
    export type DataProcessType = TemplateType | DataProcessEnum;
    export const DataProcessType = { ...TemplateType, ...DataProcessEnum };

    enum StorageEnum {}
    export type StorageType = GitServiceEnum | StorageEnum;
    export const StorageType = { ...GitServiceEnum, ...StorageEnum };

    enum CICDEnum {
      GITLAB = 'GITLAB',
      JENKINS = 'JENKINS',
      AZDO = 'AZDO', // Azure DevOps
      CIRCLE = 'CIRCLE',
    }
    export type CICDType = GitServiceEnum | CICDEnum;
    export const CICDType = { ...GitServiceEnum, ...CICDEnum };

    enum PublisherEnum {
      GITLAB = 'GITLAB',
      CLOUDFLARE = 'CLOUDFLARE',
      VERCEL = 'VERCEL',
    }
    export type PublisherType = GitServiceEnum | PublisherEnum;
    export const PublisherType = { ...GitServiceEnum, ...PublisherEnum };

    enum CDNEnum {
      CLOUDFLARE = 'CLOUDFLARE',
    }
    export type CDNType = CDNEnum;
    export const CDNType = { ...CDNEnum };

    enum GitTaskMethod {
      CREATE_REPO_FROM_TEMPLATE = 'CREATE_REPO_FROM_TEMPLATE',
    }
    export type TaskMethod = GitTaskMethod;
    export const TaskMethod = { ...GitTaskMethod };
  }

  export namespace Info {
    export type UCenterUser = {
      username: string;
      nickname?: string;
    };

    export type CmsSiteInfo = {
      title: string;
      subtitle?: string;
      description?: string;
      author?: string;
      keywords?: string[] | null;
      favicon?: string | null;
    };

    export type CmsSiteConfig = {
      configId: number;
      language?: string;
      timezone?: string;
      domain?: string;
    };

    export type Template = {
      templateName: string;
      templateRepoUrl: string;
      templateBranchName: string;
      templateType?: Enums.TemplateType;
    };

    export type Git = {
      gitToken: string;
      gitType: Enums.GitServiceType;
      gitUsername: string;
      gitReponame: string;
      gitBranchName: string;
      gitLastCommitHash?: string | null;
    };

    export type Task = {
      taskId: string;
      taskMethod: Enums.TaskMethod;
      createAt?: number;
    };
  }

  export namespace Configs {
    export type GitHubWorkerConfig = Info.UCenterUser &
      Info.CmsSiteInfo &
      Info.CmsSiteConfig &
      Info.Template &
      Info.Git;

    export type GitHubWorkerTaskConfig = Info.Task & GitHubWorkerConfig;

    export type GitWorkerConfig = GitHubWorkerConfig;
    export type GitWorkerTaskConfig = GitHubWorkerTaskConfig;
  }
}
