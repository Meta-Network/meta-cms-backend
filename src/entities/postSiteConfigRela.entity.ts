import { Post } from '@nestjs/common';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { Column, Entity, Index, ManyToOne, OneToMany, OneToOne } from 'typeorm';

import { TaskCommonState } from '../types/enum';
import { BaseEntity } from './base.entity';
import { PostEntity } from './post.entity';
import { SiteConfigEntity } from './siteConfig.entity';

@Entity()
export class PostSiteConfigRelaEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => PostEntity, (post) => post.id)
  post: PostEntity;

  @ManyToOne(() => SiteConfigEntity, (config) => config.id)
  siteConfig: SiteConfigEntity;
  @Column({
    comment: 'Post publish state',
    type: 'enum',
    enum: TaskCommonState,
    default: TaskCommonState.TODO,
  })
  @IsEnum(TaskCommonState)
  state: TaskCommonState;
}
