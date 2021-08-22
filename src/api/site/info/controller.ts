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
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

import { User } from '../../../decorators';
import { SiteInfoEntity } from '../../../entities/siteInfo.entity';
import { SiteInfoWithConfigCountEntity } from '../../../entities/siteInfoWithConfigCount.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  ResourceIsInUseException,
  ValidationException,
} from '../../../exceptions';
import {
  PaginationResponse,
  TransformResponse,
} from '../../../utils/responseClass';
import { SiteInfoLogicService } from '../../site/info/logicService';

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
  constructor(private readonly logicService: SiteInfoLogicService) {}

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
    return await this.logicService.getSiteInfo(uid, countConfig, page, limit);
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
    return await this.logicService.createSiteInfo(uid, createDto);
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
    return await this.logicService.updateSiteInfo(uid, siteId, updateDto);
  }

  @ApiOkResponse({ type: SiteInfoDeleteResponse })
  @ApiConflictResponse({
    type: ResourceIsInUseException,
    description: 'When request site has config relations',
  })
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
    return await this.logicService.deleteSiteInfo(uid, siteId);
  }
}
