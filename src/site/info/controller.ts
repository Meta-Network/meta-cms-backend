import { validateOrReject } from 'class-validator';
import { DeleteResult } from 'typeorm';
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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../decorators';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { validationErrorToBadRequestException } from '../../exceptions';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { SiteInfoService } from './service';

class SiteInfoPagination extends PaginationResponse<SiteInfoEntity> {
  @ApiProperty({ type: SiteInfoEntity, isArray: true })
  readonly items: SiteInfoEntity[];
}

class SiteInfoResponse extends TransformResponse<SiteInfoEntity> {
  @ApiProperty({ type: SiteInfoEntity })
  readonly data: SiteInfoEntity;
}

class SiteInfoWithPaginationResponse extends TransformResponse<SiteInfoPagination> {
  @ApiProperty({ type: SiteInfoPagination })
  readonly data: SiteInfoPagination;
}

class SiteInfoDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('site')
@ApiCookieAuth()
@Controller('site/info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @ApiOkResponse({ type: SiteInfoWithPaginationResponse })
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

  @ApiCreatedResponse({ type: SiteInfoResponse })
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

  @ApiOkResponse({ type: SiteInfoResponse })
  @Put(':siteId')
  async updateSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Body() updateDto: SiteInfoEntity,
    @Param('siteId', ParseIntPipe) siteId: number,
  ) {
    const siteInfo = Object.assign(new SiteInfoEntity(), updateDto);
    try {
      await validateOrReject(siteInfo, { skipMissingProperties: true });
      return await this.service.updateSiteInfo(uid, siteId, siteInfo);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
  }

  @ApiOkResponse({ type: SiteInfoDeleteResponse })
  @Delete(':siteId')
  async deleteSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Param('siteId', ParseIntPipe) siteId: number,
  ) {
    return await this.service.deleteSiteInfo(uid, siteId);
  }
}
