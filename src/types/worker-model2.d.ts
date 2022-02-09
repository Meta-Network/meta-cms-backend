import { MetaWorker } from '@metaio/worker-model2';
export type WorkerModel2TaskConfig =
  | MetaWorker.Configs.DeployTaskConfig
  | MetaWorker.Configs.PublishTaskConfig
  | MetaWorker.Configs.PostTaskConfig
  | MetaWorker.Configs.DnsTaskConfig;
export type WorkerModel2GitInfo = {
  gitInfo: MetaWorker.Info.Git;
  publishInfo?: MetaWorker.Info.Publish;
  repoEmpty: boolean;
};
