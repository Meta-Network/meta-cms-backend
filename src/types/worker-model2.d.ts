import { MetaWorker } from '@metaio/worker-model2';
export type WorkerModel2Config =
  | MetaWorker.Configs.DeployConfig
  | MetaWorker.Configs.PublishConfig
  | MetaWorker.Configs.PostConfig;
export type WorkerModel2TaskConfig =
  | MetaWorker.Configs.DeployTaskConfig
  | MetaWorker.Configs.PublishTaskConfig
  | MetaWorker.Configs.PostTaskConfig;
export type WorkerModel2GitInfo = {
  gitInfo: MetaWorker.Info.Git;
  publishInfo?: MetaWorker.Info.Publish;
  repoEmpty: boolean;
};
export type WorkModel2PostTaskResult = MetaWorker.Info.Post &
  PromiseSettledResult<void>;
