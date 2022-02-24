import { ApiProperty } from '@nestjs/swagger';
import {
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
  PrimaryColumn,
} from 'typeorm';

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
  @Column({
    comment: 'Post content',
    type: 'text',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Column({ comment: 'Post cover', nullable: false, default: '', length: 1024 })
  @IsString()
  @IsOptional()
  cover: string;

  @Column({
    comment: 'Post summary',
    nullable: false,
    default: '',
    length: 1000,
  })
  @IsString()
  @IsOptional()
  summary: string;

  @Column({
    comment: 'Post categories',
    nullable: false,
    default: '',
    length: 1000,
  })
  @IsString()
  @IsOptional()
  categories: string;

  @Column({ comment: 'Post tags', nullable: false, default: '', length: 1000 })
  @IsString()
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

  @Index()
  @Column({
    comment: 'Post digest',
    nullable: false,
    default: '',
  })
  @IsHexadecimal()
  @IsOptional()
  digest: string;
}
