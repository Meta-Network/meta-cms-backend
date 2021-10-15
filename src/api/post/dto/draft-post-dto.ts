import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  isString,
} from 'class-validator';

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
  @IsNotEmpty()
  @IsString()
  content: string;
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
}
