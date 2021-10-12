import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { PostState } from '../enums/postState';
import { BaseEntity } from './base.entity';
import { PostSiteConfigRelaEntity } from './postSiteConfigRela.entity';

@Entity()
@Index(['userId', 'state'])
export class PostEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ comment: 'Post title' })
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

  @Column({ comment: 'Post categories', type: 'simple-array', nullable: true })
  @IsString()
  @IsOptional()
  categories?: Array<string>;

  @Column({ type: 'simple-array', nullable: true, comment: 'Post tags' })
  @IsArray()
  @IsOptional()
  tags?: Array<string>;

  @OneToMany(() => PostSiteConfigRelaEntity, (rela) => rela.post, {
    nullable: true,
  })
  @ApiHideProperty()
  @ApiResponseProperty({ type: PostSiteConfigRelaEntity, example: null })
  readonly siteConfigRelas?: PostSiteConfigRelaEntity[] | null;
}
