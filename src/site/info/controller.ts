import { Controller, Get } from '@nestjs/common';
import { SiteInfoService } from './service';

@Controller('site')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get('info')
  getSiteInfo() {
    return this.service.getSiteInfo();
  }
}
