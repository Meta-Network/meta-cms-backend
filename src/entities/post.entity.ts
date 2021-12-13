import {
  IsArray,
  IsEnum,
  IsHexadecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, Index } from 'typeorm';

import { MetadataStorageType, PostState } from '../types/enum';
import { BaseEntity } from './base.entity';

@Entity()
@Index(['userId', 'state'])
export class PostEntity extends BaseEntity {
  @Column({ comment: 'UCenter user id', nullable: false, default: 0 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Column({ comment: 'Post title', nullable: false, default: '' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({
    comment: 'Post title in storage.For updating title',
    nullable: false,
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  titleInStorage: string;

  @Column({ comment: 'Post cover', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  cover?: string;

  @Column({ comment: 'Post summary', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  summary?: string;

  @Column({ comment: 'Source platform', nullable: false, default: '' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @Column({ comment: 'Post source', nullable: false, default: '' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @Column({
    comment: 'Post state',
    type: 'enum',
    enum: PostState,
    default: PostState.Pending,
  })
  @IsEnum(PostState)
  state: PostState;

  @Column({ comment: 'Post categories', type: 'simple-array', nullable: true })
  @IsString()
  @IsOptional()
  categories?: Array<string>;

  @Column({ type: 'simple-array', nullable: true, comment: 'Post tags' })
  @IsArray()
  @IsOptional()
  tags?: Array<string>;

  @Column({ comment: 'Post license', nullable: false, default: '' })
  @IsString()
  @IsOptional()
  license: string;

  @Column({
    comment: 'Post author digest request metadata storage type',
    nullable: false,
    default: '',
  })
  @IsEnum(MetadataStorageType)
  @IsOptional()
  authorDigestRequestMetadataStorageType: MetadataStorageType;

  @Column({
    comment: 'Post author digest request metadata refer',
    nullable: false,
    default: '',
  })
  @IsString()
  @IsOptional()
  authorDigestRequestMetadataRefer: string;

  @Column({
    comment: 'Post author digest signature metadata storage type',
    nullable: false,
    default: '',
  })
  @IsEnum(MetadataStorageType)
  @IsOptional()
  authorDigestSignatureMetadataStorageType: MetadataStorageType;

  @Column({
    comment: 'Post author digest signature metadata refer',
    nullable: false,
    default: '',
  })
  @IsString()
  @IsOptional()
  authorDigestSignatureMetadataRefer: string;

  @Column({
    comment:
      'Post author digest sign with content server verification metadata storage type',
    nullable: false,
    default: '',
  })
  @IsEnum(MetadataStorageType)
  @IsOptional()
  serverVerificationMetadataStorageType: MetadataStorageType;

  @Column({
    comment: 'Post author digest sign with content server verification refer',
    nullable: false,
    default: '',
  })
  @IsString()
  @IsOptional()
  serverVerificationMetadataRefer: string;

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
