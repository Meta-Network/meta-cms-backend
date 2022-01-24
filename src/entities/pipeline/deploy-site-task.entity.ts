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
export class DeploySiteTaskEntity implements IWorkerTask {
  @PrimaryColumn({
    comment: 'Publish site task id',
    length: 255,
  })
  @ApiHideProperty()
  @ApiResponseProperty({
    example: 'wt4site-123-deploy-site-5eb1ea9f-ee35-4b97-a44d-edb0c04ba406',
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
  @Column({ comment: 'Site config id', nullable: false, default: 0 })
  @ApiProperty({
    description: 'Meta Space Config ID',
    example: 1,
  })
  readonly siteConfigId: number;

  @Column({
    comment: 'Task state',
    nullable: false,
    default: PipelineOrderTaskCommonState.PENDING,
  })
  readonly state: PipelineOrderTaskCommonState;

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
}
