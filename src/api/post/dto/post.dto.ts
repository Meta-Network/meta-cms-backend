import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { MetadataStorageType, PostState } from '../../../types/enum';

export class StoragePostDto {
  /** Post title */
  @ApiProperty({ description: 'Post title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  /** Post title in storage.For updating title */
  @ApiProperty({
    description: 'Post title in storage.For updating title',
  })
  @IsOptional()
  @IsString()
  titleInStorage: string;

  /** Post cover */
  @ApiProperty({ description: 'Post cover' })
  @IsOptional()
  @IsString()
  cover: string;

  /** Post summary */
  @ApiProperty({ description: 'Post summary' })
  @IsOptional()
  @IsString()
  summary: string;

  /** Post tags */
  @ApiProperty({ description: 'Post tags' })
  @IsOptional()
  @IsArray()
  tags: Array<string>;

  /** Post categories */
  @ApiProperty({ description: 'categories' })
  @IsOptional()
  @IsArray()
  categories: Array<string>;

  /** Post content source */
  @ApiProperty({ description: 'Post content source' })
  @IsOptional()
  @IsString()
  source: string;

  /** Post license */
  @ApiProperty({ description: 'license' })
  @IsOptional()
  @IsString()
  license: string;

  /** Source platform */
  @ApiProperty({ description: 'Source platform' })
  @IsOptional()
  @IsString()
  platform: string;

  /** Post state */
  @ApiProperty({
    description: 'Post state',
    type: 'enum',
    enum: PostState,
    default: PostState.Pending,
  })
  @IsOptional()
  @IsEnum(PostState)
  state: PostState;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestRequestMetadataStorageType: MetadataStorageType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  authorDigestRequestMetadataRefer: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestSignatureMetadataStorageType: MetadataStorageType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  authorDigestSignatureMetadataRefer: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsISO8601()
  createdAt: string;

  @ApiProperty()
  @IsOptional()
  @IsISO8601()
  updatedAt: string;
}
