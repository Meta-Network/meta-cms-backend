import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { SiteConfigService } from './service';

@ApiTags('site')
@ApiCookieAuth()
@Controller('site/config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get(':siteId')
  getSiteInfo(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.service.getSiteConfig(siteId);
  }
}
