export class GeneratePublishSiteOrderEvent {
  userId: number;
  postTaskId: string;
}
export class LinkOrGeneratePublishSiteTaskEvent {
  userId: number;
  siteConfigId: number;
}
export const GENERATE_PUBLISH_SITE_ORDER_EVENT =
  'generatePublishSiteOrderEvent';
export const LINK_OR_GENERATE_PUBLISH_SITE_TASK_EVENT =
  'linkOrGeneratePubishSiteTaskEvent';
