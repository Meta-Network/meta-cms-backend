import { ApiProperty } from '@nestjs/swagger';

import { ManagementAuthorization } from '../../../ethereum/management/dto';

export class ManagementAuthorizationDto extends ManagementAuthorization {}

export class ManagementAuthorizationWithToken {
  @ApiProperty({ description: 'Management authorization request info' })
  authInfo: ManagementAuthorizationDto;

  @ApiProperty({ description: 'Management authorization JWT token' })
  token: string;
}
