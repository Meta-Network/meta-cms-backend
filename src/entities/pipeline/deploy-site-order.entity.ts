import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class DeploySiteOrderEntity {
  @PrimaryColumn({
    comment: 'Use author signature as deploy site order id.',
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
  @ApiProperty({
    description: 'User ID',
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
  @ApiHideProperty()
  @ApiResponseProperty({
    example:
      '0xb1983a9ad9bf4a305af98c28055af9e6d49927b88653aef10f36c78d7c6fa69cf6a246e04e5d8ff2243e4f16bf4b1ce81db1118df640d685d3d1a3bd6211a702',
  })
  serverVerificationId?: string;

  @Column({
    comment: 'Deploy site task id',
    nullable: false,
    default: '',
  })
  @ApiHideProperty()
  @ApiResponseProperty({
    example: 'wt4site-123-deploy-site-5eb1ea9f-ee35-4b97-a44d-edb0c04ba406',
  })
  deploySiteTaskId?: string;
}
