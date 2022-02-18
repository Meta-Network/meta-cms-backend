import {
  ApiHideProperty,
  ApiProperty,
  ApiResponseProperty,
} from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ServerVerificationEntity {
  @PrimaryColumn({
    comment:
      'Use server verification signature as server verification entity id.',
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
  id: string;
  @ApiProperty({
    description: '服务端校验（回执）载荷',
    required: true,
  })
  @Column({
    comment: 'server verification payload',
    type: 'text',
  })
  payload: string;
  @CreateDateColumn()
  @ApiHideProperty()
  @ApiResponseProperty({ example: '2021-07-27T11:39:39.150Z' })
  readonly createdAt: Date;
}
