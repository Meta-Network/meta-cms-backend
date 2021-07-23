import { Request } from 'express';
import * as core from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';
import qs from 'qs';

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
  purpose: string;
  account: UCenterAccount;
}

export interface RequestBodyWithJWTPayload
  extends Record<string | number | symbol, any> {
  jwtPayload: UCenterJWTPayload;
}

export type RequestWithJWTPayload = Request<
  core.ParamsDictionary,
  any,
  RequestBodyWithJWTPayload,
  qs.ParsedQs
>;

export type RequestWithUser = {
  user: UCenterJWTPayload;
} & Request;
