import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

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
