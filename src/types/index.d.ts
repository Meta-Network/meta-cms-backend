import { MetaWorker } from '@metaio/worker-model';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UCenterUser {
  bio: string;
  avatar: string;
  username: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

export interface UCenterAccount {
  id: number;
  user_id: number;
  account_id: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface UCenterJWTPayload extends JwtPayload, UCenterUser {
  id: number;
  purpose: 'access_token' | 'refresh_token' | string;
  account: UCenterAccount;
}

export interface RequestWithUser extends Request {
  user: UCenterJWTPayload;
}

export interface TransformResponse<T = any> {
  data: T;
  statusCode: number;
  message: string;
}

export type RemoveIndex<Q> = {
  [key in keyof Q as string extends key
    ? never
    : key extends string
    ? key
    : never]: Q[key];
};

export type QueueTaskConfig =
  | MetaWorker.Configs.DeployTaskConfig
  | MetaWorker.Configs.PublishTaskConfig
  | MetaWorker.Configs.PostTaskConfig
  | MetaWorker.Configs.DnsTaskConfig;

export type GenerateMetaWorkerGitInfo = {
  gitInfo: MetaWorker.Info.Git;
  publishInfo?: MetaWorker.Info.Publish;
  repoEmpty: boolean;
};

export type CreateGitRepoResult = {
  status: boolean;
  empty: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
};
