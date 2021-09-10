import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Column, Entity, Index } from "typeorm";
import { PostState } from "../enums/postState";

import { BaseEntity } from "./base.entity";

@Entity()
@Index(['userId', 'state'])
export class PostEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ comment: 'Post title'})
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ comment: 'Post cover', nullable: true })
  @IsString()
  @IsOptional()
  cover?: string;

  @Column({ comment: 'Post summary', nullable: true })
  @IsString()
  @IsOptional()
  summary?: string;

  @Column({ comment: 'Source platform' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @Column({ comment: 'Post source' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @Column({
    comment: 'Post state',
    type: 'enum',
    enum: PostState,
    default: PostState.Pending,
  })
  @IsEnum(PostState)
  state: PostState;
}