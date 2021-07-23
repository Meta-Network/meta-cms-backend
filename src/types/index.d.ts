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
  purpose: 'access_token' | 'refresh_token' | string;
  account: UCenterAccount;
}

export interface RequestWithUser extends Request {
  user: UCenterJWTPayload;
}
