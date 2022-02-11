import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsNumber } from 'class-validator';

import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';

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

export class PublishSiteOrderInQueueResponseDto {
  @ApiProperty({
    description: 'Pending publish site order',
    required: false,
  })
  pending: PublishSiteOrderEntity;
  @ApiProperty({
    description: 'Doing publish site order',
    required: false,
  })
  doing: PublishSiteOrderEntity;
}
