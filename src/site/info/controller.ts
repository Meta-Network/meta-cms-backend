import { validateOrReject } from 'class-validator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { User } from '../../decorators';
import { SiteInfo } from '../../entities/siteInfo';
import { validationErrorToBadRequestException } from '../../exceptions';
import { SiteInfoService } from './service';

@Controller('site/info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  async getSiteInfo(@User('id', ParseIntPipe) uid: number) {
    return await this.service.getSiteInfo(uid);
  }

  @Post()
  async createSiteInfo(
    @Body() createDto: SiteInfo,
    @User('id', ParseIntPipe) uid: number,
  ) {
    const siteInfo = Object.assign(new SiteInfo(), {
      ...createDto,
      userId: uid,
    });
    try {
      await validateOrReject(siteInfo);
      return await this.service.createSiteInfo(siteInfo);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  @Put(':siteId')
  async updateSiteInfo(
    @Body() updateDto: SiteInfo,
    @Param('siteId', ParseIntPipe) siteId: number,
  ) {
    const siteInfo = Object.assign(new SiteInfo(), updateDto);
    try {
      await validateOrReject(siteInfo, { skipMissingProperties: true });
      return await this.service.updateSiteInfo(siteId, siteInfo);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  @Delete(':siteId')
  async deleteSiteInfo(@Param('siteId', ParseIntPipe) siteId: number) {
    return await this.service.deleteSiteInfo(siteId);
  }
}
