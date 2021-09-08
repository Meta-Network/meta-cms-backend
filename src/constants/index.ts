export enum BullQueueType {
  WORKER_GIT = 'WORKER_GIT',
  WORKER_HEXO = 'WORKER_HEXO',
}

export enum BullProcessorType {
  CREATE_SITE = 'CREATE_SITE',
  UPDATE_SITE = 'UPDATE_SITE',
}

export enum NestMetadataType {
  SkipUCenterAuth = 'SKIP_U_CENTER_AUTH',
}

export enum MetaMicroserviceClient {
  UCenter = 'UCENTER_MS_CLIENT',
  Network = 'NETWORK_MS_CLIENT',
  CMS = 'CMS_MS_CLIENT',
}
