import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
export class AccessTokenEntity extends BaseEntity {
  @Column({ comment: 'Platform' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @Column({ comment: 'Access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
