import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { MetadataStorageType } from '../../../types/enum';

export class DraftPostCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cover: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  tags: Array<string>;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  categories: Array<string>;

  @ApiProperty()
  @IsOptional()
  @IsString()
  content: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  license: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestRequestMetadataStorageType: MetadataStorageType;

  @ApiProperty()
  @IsOptional()
  authorDigestRequestMetadataRefer: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestSignatureMetadataStorageType: MetadataStorageType;

  @ApiProperty()
  @IsOptional()
  authorDigestSignatureMetadataRefer: string;
}

export class DraftPostUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cover: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  tags: Array<string>;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  categories: Array<string>;

  @ApiProperty()
  @IsOptional()
  @IsString()
  content: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  license: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestRequestMetadataStorageType: MetadataStorageType;

  @ApiProperty()
  @IsOptional()
  authorDigestRequestMetadataRefer: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(MetadataStorageType)
  authorDigestSignatureMetadataStorageType: MetadataStorageType;
  @ApiProperty()
  @IsOptional()
  authorDigestSignatureMetadataRefer: string;
}
