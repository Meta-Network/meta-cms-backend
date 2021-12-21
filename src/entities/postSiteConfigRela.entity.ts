import { IsEnum } from 'class-validator';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { PostAction, TaskCommonState } from '../types/enum';
import { BaseEntity } from './base.entity';
import { SiteConfigEntity } from './siteConfig.entity';

@Entity()
export class PostSiteConfigRelaEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Post title' })
  postTitle: string;

  @Index()
  @Column({ comment: 'Task workspace for post task' })
  taskWorkspace: string;

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

  @Column({
    comment: 'Post action',
    type: 'enum',
    enum: PostAction,
    default: PostAction.CREATE,
  })
  @IsEnum(PostAction)
  action: PostAction;
}
