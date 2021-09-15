import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DomainvalidateStatus } from '../../../types/enum';

export class DomainValidateRequest {
  /**
   * Validate query domain prefix
   * @example 'meta-cms'
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Validate query domain prefix',
    example: 'meta-cms',
  })
  domain: string;
}

export class DomainvalidateResult {
  @ApiResponseProperty({ example: 'example' })
  value: string;
  @ApiResponseProperty({
    type: DomainvalidateStatus,
    enum: DomainvalidateStatus,
    example: DomainvalidateStatus.Available,
  })
  status: DomainvalidateStatus;
}
