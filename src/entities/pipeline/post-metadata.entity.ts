import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsHexadecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { PostOrderEntity } from './post-order.entity';

@Entity()
export class PostMetadataEntity {
  @PrimaryColumn({
    comment: 'Post metadata id. Use author signature as id',
    length: 255,
  })
  readonly id: string;
  @CreateDateColumn()
  readonly createdAt: Date;
  @Column({ comment: 'Post title', nullable: false, default: '' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ comment: 'Post cover', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  cover: string;

  @Column({ comment: 'Post summary', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  summary: string;

  @Column({ comment: 'Post categories', type: 'simple-array', nullable: true })
  @IsOptional()
  categories?: string;

  @Column({ nullable: true, comment: 'Post tags' })
  @IsOptional()
  tags: string;

  @Column({ comment: 'Post license', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  license: string;

  @ApiProperty({
    description: '作者签名密钥的公钥',
    required: true,
  })
  @Index()
  @Column({
    comment: 'Post author public key',
    nullable: false,
    default: '',
  })
  @IsHexadecimal()
  @IsOptional()
  authorPublicKey: string;
}
