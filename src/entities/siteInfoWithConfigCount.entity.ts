import { ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';

import { SiteInfoEntity } from './siteInfo.entity';

export class SiteInfoWithConfigCountEntity extends SiteInfoEntity {
  @ApiHideProperty()
  @ApiResponseProperty({ type: Number, example: 1 })
  readonly configCount: number;
}
