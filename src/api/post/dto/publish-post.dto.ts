import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class PublishPostDto {
  @ApiProperty({ description: 'Site config ids', example: [1, 2] })
  @IsArray()
  configIds: number[];
}
