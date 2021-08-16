import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
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
import { SiteConfigLogicService } from 'src/api/site/config/logicService';
import { User } from 'src/decorators';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  RelationNotFoundException,
  ResourceIsInUseException,
  ValidationException,
} from 'src/exceptions';
import { PaginationResponse, TransformResponse } from 'src/utils/responseClass';
import { DeleteResult } from 'typeorm';

class SiteConfigPagination extends PaginationResponse<SiteConfigEntity> {
  @ApiProperty({ type: SiteConfigEntity, isArray: true })
  readonly items: SiteConfigEntity[];
}

class SiteConfigWithPaginationResponse extends TransformResponse<SiteConfigPagination> {
  @ApiProperty({ type: SiteConfigPagination })
  readonly data: SiteConfigPagination;
}

class SiteConfigResponse extends TransformResponse<SiteConfigEntity> {
  @ApiProperty({ type: SiteConfigEntity })
  readonly data: SiteConfigEntity;
}

class SiteConfigDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('site')
@ApiCookieAuth()
@Controller('site/config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigLogicService) {}

  @ApiOkResponse({ type: SiteConfigWithPaginationResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site id in database was not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request user id does not match site info `userId`',
  })
  @ApiQuery({ name: 'siteId', type: Number, example: 1 })
  @ApiQuery({ name: 'page', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, example: 10 })
  @Get()
  async getSiteConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('siteId', ParseIntPipe) siteId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return await this.service.getSiteConfig(uid, siteId, page, limit);
  }

  @ApiCreatedResponse({ type: SiteConfigResponse })
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
    description: 'When request user id does not match site info `userId`',
  })
  @ApiQuery({ name: 'siteId', type: Number, example: 1 })
  @Post()
  async createSiteConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('siteId', ParseIntPipe) siteId: number,
    @Body() createDto: SiteConfigEntity,
  ) {
    return await this.service.createSiteConfig(uid, siteId, createDto);
  }

  @ApiOkResponse({ type: SiteConfigResponse })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request config id in database was not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description:
      'When request user id or site id does not match site info `userId` or `siteInfo.id`',
  })
  @ApiQuery({ name: 'siteId', type: Number, example: 1 })
  @Patch(':configId')
  async updateSiteConfig(
    @User('id', ParseIntPipe) uid: number,
    @Param('configId', ParseIntPipe) configId: number,
    @Query('siteId', ParseIntPipe) siteId: number,
    @Body() updateDto: SiteConfigEntity,
  ) {
    return await this.service.updateSiteConfig(
      uid,
      siteId,
      configId,
      updateDto,
    );
  }

  @ApiOkResponse({ type: SiteConfigDeleteResponse })
  @ApiConflictResponse({
    type: ResourceIsInUseException,
    description:
      'When request config is in use, e.g. storeProviderId is not null',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request config id in database was not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When config relation was not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request user id does not match site info `userId`',
  })
  @Delete(':configId')
  async deleteSiteConfig(
    @User('id', ParseIntPipe) uid: number,
    @Param('configId', ParseIntPipe) configId: number,
  ) {
    return await this.service.deleteSiteConfig(uid, configId);
  }
}