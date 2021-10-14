import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
export class DraftEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
