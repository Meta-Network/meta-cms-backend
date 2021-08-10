export enum TemplateType {
  HEXO = 'HEXO',
}

/** Only for api query param use */
enum TemplateQueryEnum {
  ALL = 'ALL',
}
export type TemplateQueryType = TemplateType | TemplateQueryEnum;
export const TemplateQueryType = { ...TemplateType, ...TemplateQueryEnum };

enum DataProcessEnum {}
export type DataProcessType = TemplateType | DataProcessEnum;
export const DataProcessType = { ...TemplateType, ...DataProcessEnum };

// Base
enum GitServiceEnum {
  GITHUB = 'GITHUB',
  GITEE = 'GITEE',
}

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
