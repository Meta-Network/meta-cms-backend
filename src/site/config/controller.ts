import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { SiteConfigService } from './service';

@ApiCookieAuth()
@Controller('site/config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get(':siteId')
  getSiteInfo(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.service.getSiteConfig(siteId);
  }
}
