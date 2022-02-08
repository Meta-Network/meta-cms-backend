import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsNumber } from 'class-validator';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';

export class DeploySiteOrderRequestDto {
  @ApiProperty({
    description: 'Meta Space Config ID',
    required: true,
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  siteConfigId: number;
}
export class DeploySiteOrderResponseDto {
  @IsNotEmptyObject()
  deploySiteOrder: DeploySiteOrderEntity;
}