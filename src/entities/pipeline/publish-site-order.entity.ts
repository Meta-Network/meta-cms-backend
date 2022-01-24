import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PublishSiteOrderEntity {
  @PrimaryGeneratedColumn({ unsigned: true })
  @ApiHideProperty()
  @ApiResponseProperty({ example: 1 })
  readonly id: number;

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
    comment: 'Use server verification signature as server verification id.',
    nullable: false,
    default: '',
  })
  @ApiResponseProperty({
    example:
      '0xb1983a9ad9bf4a305af98c28055af9e6d49927b88653aef10f36c78d7c6fa69cf6a246e04e5d8ff2243e4f16bf4b1ce81db1118df640d685d3d1a3bd6211a702',
  })
  serverVerificationId?: string;

  @Column({
    comment: 'Publish site task id',
    nullable: false,
    default: '',
  })
  publishSiteTaskId?: string;
}
