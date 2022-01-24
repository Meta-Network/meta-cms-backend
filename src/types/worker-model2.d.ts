import { MetaWorker } from '@metaio/worker-model2';
export type MetaWorkerTaskConfigV2 =
  | MetaWorker.Configs.DeployTaskConfig
  | MetaWorker.Configs.PublishTaskConfig
  | MetaWorker.Configs.PostTaskConfig
  | MetaWorker.Configs.DnsTaskConfig;
