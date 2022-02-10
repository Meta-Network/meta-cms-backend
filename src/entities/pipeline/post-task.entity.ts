import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn';

import { PipelineOrderTaskCommonState } from '../../types/enum';
import { IWorkerTask } from './worker-task.interface';

@Entity()
export class PostTaskEntity implements IWorkerTask {
  @PrimaryColumn({
    comment: 'Post task id',
    length: 255,
  })
  @ApiHideProperty()
  @ApiResponseProperty({
    example: 'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
  })
  readonly id: string;

  @CreateDateColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly createdAt: Date;

  @UpdateDateColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly updatedAt: Date;
  @Column({ comment: 'UCenter user id', nullable: false, default: 0 })
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  readonly userId: number;
  @Column({
    comment: 'Task state',
    nullable: false,
    default: PipelineOrderTaskCommonState.PENDING,
  })
  state: PipelineOrderTaskCommonState;

  @Column({
    comment: 'The name of the worker assigned to handle this task',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiResponseProperty({ example: 'meta-cms-worker-1-' })
  workerName?: string;
  @Column({
    comment: 'Worker auth',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiResponseProperty({ example: 'dc3a536f-f7a9-4734-88d6-97cf0f5b06c4' })
  workerSecret?: string;
  @ApiHideProperty()
  @ApiProperty({
    description: '此文章关联的MetaSpace发布请求的ID',
  })
  @ApiResponseProperty({
    example: 123,
  })
  @Column({
    comment: 'Publish site order id',
    nullable: false,
    default: 0,
  })
  publishSiteOrderId?: number;
  @ApiHideProperty()
  @ApiProperty({
    description: '此文章关联的MetaSpace发布请求的ID',
  })
  @ApiResponseProperty({
    example: 123,
  })
  @Column({
    comment: 'Publish site task id',
    nullable: false,
    default: '',
  })
  publishSiteTaskId?: string;
}
