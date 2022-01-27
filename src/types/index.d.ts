import { MetaWorker } from '@metaio/worker-model';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';

import { RealTimeEventState } from './enum';

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

export type GitTreeInfo = {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
};

export type GitBlobInfo = {
  content?: string;
  encoding?: string;
  url?: string;
  sha?: string;
  size?: number;
  node_id?: string;
};

export type GetGitTreeResult = {
  sha: string;
  url: string;
  truncated: boolean;
  tree: GitTreeInfo[];
};

export interface PostPublishingStateNotification {
  stateChanged: boolean;
}

export interface PostPublishNotification {
  allPostCount: number;
  publishingCount: number;
  publishedCount: number;
  publishingAlertFlag: boolean;
}

export interface InvitationStateUpdatedNotification {
  availableInvitationCodeCount: number;
}

export type StateNotification =
  | PostPublishNotification
  | PostPublishingStateNotification
  | InvitationStateUpdatedNotification;

export interface StateData {
  id: string;
  submit?: RealTimeEventState;
  publish?: RealTimeEventState;
  certificate?: {
    sign: string;
    state: RealTimeEventState;
  };
}

export type InvitationCountData = number;

export interface VerifiedSocket extends Socket {
  userId: number;
}
