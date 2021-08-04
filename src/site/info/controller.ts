import { validateOrReject } from 'class-validator';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { DeleteResult } from 'typeorm';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../decorators';
import { SiteInfoEntity } from '../../entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from '../../entities/siteInfoWithConfigCount.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  validationErrorToBadRequestException,
  ValidationException,
} from '../../exceptions';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { SiteInfoService } from './service';

class SiteInfoPagination extends PaginationResponse<SiteInfoEntity> {
  @ApiProperty({ type: SiteInfoEntity, isArray: true })
  readonly items: SiteInfoEntity[];
}

class SiteInfoWithConfigCountPagination extends PaginationResponse<SiteInfoWithConfigCountEntity> {
  @ApiProperty({ type: SiteInfoWithConfigCountEntity, isArray: true })
  readonly items: SiteInfoWithConfigCountEntity[];
}

class SiteInfoResponse extends TransformResponse<SiteInfoEntity> {
  @ApiProperty({ type: SiteInfoEntity })
  readonly data: SiteInfoEntity;
}

class SiteInfoWithPaginationResponse extends TransformResponse<SiteInfoPagination> {
  @ApiProperty({ type: SiteInfoPagination })
  readonly data: SiteInfoPagination;
}

class SiteInfoWithConfigCountPaginationResponse extends TransformResponse<SiteInfoWithConfigCountPagination> {
  @ApiProperty({ type: SiteInfoWithConfigCountPagination })
  readonly data: SiteInfoWithConfigCountPagination;
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
  @ApiOkResponse({
    type: SiteInfoWithConfigCountPaginationResponse,
    description: 'When request query param with `countConfig=true`',
  })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  @Get()
  async getSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Query('countConfig', new DefaultValuePipe(false), ParseBoolPipe)
    countConfig = false,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    limit = limit > 100 ? 100 : limit;
    const option: IPaginationOptions = {
      page,
      limit,
      route: '/site/info',
    };

    if (countConfig) {
      return await this.service.getSiteInfoAndCountConfig(option, uid);
    }

    return await this.service.getSiteInfo(option, uid);
  }

  @ApiCreatedResponse({ type: SiteInfoResponse })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @Post()
  async createSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Body() createDto: SiteInfoEntity,
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
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site id in database was not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request user id does not match',
  })
  @Patch(':siteId')
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
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site id in database was not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request user id does not match',
  })
  @Delete(':siteId')
  async deleteSiteInfo(
    @User('id', ParseIntPipe) uid: number,
    @Param('siteId', ParseIntPipe) siteId: number,
  ) {
    return await this.service.deleteSiteInfo(uid, siteId);
  }
}
