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
