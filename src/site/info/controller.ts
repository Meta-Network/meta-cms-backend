import { Controller, Get, ParseIntPipe } from '@nestjs/common';
import { User } from '../../decorators';
import { SiteInfoService } from './service';

@Controller('site/info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  getSiteInfo(@User('id', ParseIntPipe) uid: number) {
    return this.service.getSiteInfo(uid);
  }
}
