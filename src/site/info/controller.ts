import { Controller, Get } from '@nestjs/common';
import { SiteInfoService } from './service';

@Controller('site/info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  getSiteInfo() {
    return this.service.getSiteInfo();
  }
}
