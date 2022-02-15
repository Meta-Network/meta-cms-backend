import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  MetadataStorageType,
  PipelineOrderTaskCommonState,
} from '../../types/enum';
import { PostMetadataEntity } from './post-metadata.entity';

@Entity()
@Index(['userId', 'publishState', 'submitState', 'certificateState'])
export class PostOrderEntity {
  @PrimaryColumn({
    comment: 'Use author signature as post metadata id.',
    length: 255,
  })
  @ApiHideProperty()
  @ApiResponseProperty({
    example:
      '0xd8983a9ad9bf4a305af98c28055af9e6d49927b88653aef10f36c78d7c6fa69cf6a246e04e5d8ff2243e4f16bf4b1ce81db1118df640d685d3d1a3bd6211a702',
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
  @ApiHideProperty()
  @ApiProperty({
    description: '用户ID',
  })
  @ApiResponseProperty({
    example: 1,
  })
  readonly userId: number;

  @ApiHideProperty()
  @ApiProperty({
    description: '文章提交状态',
  })
  @ApiResponseProperty({
    example: PipelineOrderTaskCommonState.PENDING,
  })
  @Column({
    comment: 'Submit state',
    nullable: false,
    default: PipelineOrderTaskCommonState.PENDING,
  })
  submitState: PipelineOrderTaskCommonState;

  @ApiHideProperty()
  @ApiResponseProperty({
    example: PipelineOrderTaskCommonState.PENDING,
  })
  @Column({
    comment: 'Publish state',
    nullable: false,
    default: PipelineOrderTaskCommonState.PENDING,
  })
  publishState: PipelineOrderTaskCommonState;

  @Column({
    comment: 'Use server verification signature as server verification id.',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiProperty({
    description:
      '服务端校验签名，作为回执ID。之后这个回执会传到永在网上，可以和此进行比对',
  })
  @ApiResponseProperty({
    example:
      '0xa1983a9ad9bf4a305af98c28055af9e6d49927b88653aef10f36c78d7c6fa69cf6a246e04e5d8ff2243e4f16bf4b1ce81db1118df640d685d3d1a3bd6211a702',
  })
  serverVerificationId?: string;

  @ApiHideProperty()
  @ApiProperty({
    description: '存证仓储类型',
  })
  @ApiResponseProperty({
    enum: MetadataStorageType,
    example: 'arweave',
  })
  @Column({
    comment: 'Use server verification as certificate.Use permweb as storage',
    nullable: false,
    default: '',
  })
  certificateStorageType?: MetadataStorageType;

  @ApiHideProperty()
  @ApiProperty({
    description:
      '存证在永在网上的ID，可以用这个ID在对应的服务找到证书，也可以在Meta Network Data Viewer里确认',
  })
  @ApiResponseProperty({
    example: 'Fs1Z9gUOAdNR7J5B8vy9oBazwfCbEIUbdQQKm9m-C6c',
  })
  @Column({
    comment: 'Use Arweave tx id / IPFS CID / ... as certifcate id',
    nullable: false,
    default: '',
  })
  certificateId?: string;

  @ApiHideProperty()
  @ApiProperty({
    description:
      '存证状态。如果没有要求存证则为空。提交到对应合约则为doing，有时间戳证明则为finished。如果合约调用或是区块打包失败，则为failed',
  })
  @Column({
    comment: 'Certificate state',
    nullable: false,
    default: '',
  })
  certificateState?: PipelineOrderTaskCommonState;

  @Index()
  @Column({
    comment: 'The id of the task to process this order. Many to one',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiProperty({
    description: '此文章关联的提交任务的ID',
  })
  @ApiResponseProperty({
    example: 'wt4site-123-create-posts-90c618b6-a3e8-4958-8e9e-93ec103a2a45',
  })
  postTaskId?: string;

  @Index()
  @Column({
    comment: 'The id of the order to publish site for this post. Many to one',
    nullable: false,
    default: 0,
  })
  @ApiHideProperty()
  @ApiProperty({
    description: '此文章关联的MetaSpace发布请求的ID',
  })
  @ApiResponseProperty({
    example: 123,
  })
  publishSiteOrderId?: number;

  @Index()
  @Column({
    comment: 'The id oft the task to publish site for this post. Many to one',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiProperty({
    description: '将此文章发布的MetaSpace发布任务的ID',
  })
  @ApiResponseProperty({
    example: 'wt4site-123-publsh-site-8bde738e-f25a-40cb-812d-ed6b2c09e28e',
  })
  publishSiteTaskId?: string;

  @ApiHideProperty()
  @ApiProperty({
    description: '文章元数据',
  })
  @OneToOne(
    () => PostMetadataEntity,
    (postMetadataEntity) => postMetadataEntity.id,
    { primary: true, cascade: false },
  )
  @JoinColumn({ name: 'id' })
  readonly postMetadata?: PostMetadataEntity;
}
