import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
export class AccessTokenEntity extends BaseEntity {
  @Column({ comment: 'Platform' })
  @IsString()
  @IsNotEmpty()
  @Index()
  platform: string;

  @Column({ comment: 'Access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
