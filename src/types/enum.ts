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
