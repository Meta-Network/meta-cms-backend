import { MetaWorker } from '@metaio/worker-model';

/** Only for api query param use */
enum TemplateQueryEnum {
  ALL = 'ALL',
}
export type TemplateQueryType =
  | MetaWorker.Enums.TemplateType
  | TemplateQueryEnum;
export const TemplateQueryType = {
  ...MetaWorker.Enums.TemplateType,
  ...TemplateQueryEnum,
};

export enum DomainvalidateStatus {
  Available = 'AVAILABLE',
  Occupied = 'OCCUPIED',
  Reserve = 'RESERVE',
  Disable = 'DISABLE',
}

export enum SiteStatus {
  /** SiteConfig generated */
  Configured = 'CONFIGURED',
  /** Deploy worker running */
  Deploying = 'DEPLOYING',
  /** Site deployed, e.g. repo init & push */
  Deployed = 'DEPLOYED',
  /** Publish worker running */
  Publishing = 'PUBLISHING',
  /** Site published, can be visit */
  Published = 'PUBLISHED',
}

export enum TaskCommonState {
  TODO = 'TODO',
  DOING = 'DOING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

export enum MetadataStorageType {
  IPFS = 'ipfs',
  ARWEAVE = 'arweave',
}

export enum TaskWorkerType {
  WORKER_GIT = 'WORKER_GIT',
  WORKER_HEXO = 'WORKER_HEXO',
}

export enum TaskWorkerJobProcessorType {
  MOCK = 'MOCK',
  DOCKER = 'DOCKER',
  SEPARATE_PROCESS = 'SEPARATE_PROCESS',
}

export enum TaskEvent {
  SITE_PUBLISHED = 'site.published',
}

export enum PostState {
  Pending = 'pending',
  PendingEdit = 'pending_edit',
  Published = 'published',
  SitePublished = 'site_published',
  Ignored = 'ignored',
  Deleted = 'deleted',
  Drafted = 'drafted',
  Invalid = 'invalid',
}

export enum GetPostsFromStorageState {
  Drafted = 'drafted',
  Posted = 'posted',
  Published = 'published',
}

export enum PostAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum NestMetadataType {
  SkipUCenterAuth = 'SKIP_U_CENTER_AUTH',
}

export enum MetaMicroserviceClient {
  UCenter = 'UCENTER_MS_CLIENT',
  Network = 'NETWORK_MS_CLIENT',
  CMS = 'CMS_MS_CLIENT',
}

export enum RealTimeNotificationEvent {
  POST_COUNT_UPDATED = 'post.count.updated',
  SPACE_COUNT_UPDATED = 'space.count.updated',
  INVITATION_COUNT_UPDATED = 'invitation.count.updated',
  POST_PUBLISHING_STATE_UPDATED = 'post.publishing.state.updated',
}

export enum InternalRealTimeEvent {
  POST_STATE_UPDATED = 'post.state.updated',
  SPACE_STATE_UPDATED = 'space.state.updated',
  INVITATION_COUNT_UPDATED = 'invitation.count.updated',
}

export enum RealTimeEventState {
  pending = 'pending',
  doing = 'doing',
  finished = 'finished',
  failed = 'failed',
}
