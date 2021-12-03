import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInstance, IsNumber } from 'class-validator';

import { StoragePostDto } from './post.dto';

export class PublishPostDto {
  @ApiProperty({ description: 'Site config ids', example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  configIds: number[];
}

export class PublishPostsDto extends PublishPostDto {
  @ApiProperty({ description: 'Post ids', example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  postIds: number[];
}

export class PublishStoragePostsDto {
  @ApiProperty({ description: 'Site config ids', example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  configIds: number[];

  @ApiProperty({ description: 'Storage post object' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(StoragePostDto, { each: true })
  posts: StoragePostDto[];
}
