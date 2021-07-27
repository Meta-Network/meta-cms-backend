import { validateOrReject } from 'class-validator';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { User } from '../../decorators';
import { SiteInfoEntity } from '../../entities/siteInfo';
import { validationErrorToBadRequestException } from '../../exceptions';
import { SiteInfoService } from './service';

@Controller('site/info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  async getSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    limit = limit > 100 ? 100 : limit;

    return await this.service.getSiteInfo(
      {
        page,
        limit,
        route: '/site/info',
      },
      uid,
    );
  }

  @Post()
  async createSiteInfo(
    @Body() createDto: SiteInfoEntity,
    @User('id', ParseIntPipe) uid: number,
  ) {
    const siteInfo = Object.assign(new SiteInfoEntity(), {
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
    @Body() updateDto: SiteInfoEntity,
    @Param('siteId', ParseIntPipe) siteId: number,
  ) {
    const siteInfo = Object.assign(new SiteInfoEntity(), updateDto);
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
