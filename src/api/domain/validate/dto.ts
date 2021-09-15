import { ApiResponseProperty } from '@nestjs/swagger';

import { DomainvalidateStatus } from '../../../types/enum';

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
