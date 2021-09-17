import path from 'path';

export const configPath =
  process.env.CONFIG_PATH || path.join(__dirname, '..', '..', 'config');

export enum TaskWorkerType {
  WORKER_GIT = 'WORKER_GIT',
  WORKER_HEXO = 'WORKER_HEXO',
}

export enum TaskWorkerJobProcessorType {
  MOCK = 'MOCK',
  DOCKER = 'DOCKER',
  SEPARATE_PROCESS = 'SEPARATE_PROCESS',
}

export enum NestMetadataType {
  SkipUCenterAuth = 'SKIP_U_CENTER_AUTH',
}

export enum MetaMicroserviceClient {
  UCenter = 'UCENTER_MS_CLIENT',
  Network = 'NETWORK_MS_CLIENT',
  CMS = 'CMS_MS_CLIENT',
}
