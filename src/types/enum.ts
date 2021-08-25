import { MetaWorker } from './metaWorker';

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
