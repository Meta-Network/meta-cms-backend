import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
@Index(['userId', 'platform'], { unique: true })
@Index(['userId', 'active'])
export class AccessTokenEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ comment: 'Platform' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @Column({ comment: 'Access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @Column({ type: 'boolean', comment: 'Is actived for synchronizer' })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
