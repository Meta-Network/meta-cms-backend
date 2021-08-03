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
import { User } from '../../decorators';
import { SiteConfigEntity } from '../../entities/siteConfig.entity';
import {
  AccessDeniedException,
  DataNotFoundException,
  ResourceIsInUseException,
  validationErrorToBadRequestException,
  ValidationException,
} from '../../exceptions';
import {
  PaginationResponse,
  TransformResponse,
} from '../../utils/responseClass';
import { SiteConfigService } from './service';

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
  constructor(private readonly service: SiteConfigService) {}

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
    limit = limit > 100 ? 100 : limit;

    return await this.service.getSiteConfig(
      {
        page,
        limit,
        route: '/site/config',
      },
      uid,
      siteId,
    );
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
    const siteConfig = Object.assign(new SiteConfigEntity(), createDto);
    try {
      await validateOrReject(siteConfig);
      return await this.service.createSiteConfig(uid, siteId, siteConfig);
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
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
    const siteConfig = Object.assign(new SiteConfigEntity(), updateDto);
    try {
      await validateOrReject(siteConfig, { skipMissingProperties: true });
      return await this.service.updateSiteConfig(
        uid,
        siteId,
        configId,
        updateDto,
      );
    } catch (errors) {
      throw validationErrorToBadRequestException(errors);
    }
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
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request user id does not match site info `userId`',
  })
  @Delete(':configId')
  async deleteSiteConfig(
    @User('id', ParseIntPipe) uid: number,
    @Param('configId', ParseIntPipe) configId: number,
  ) {
    return this.service.deleteSiteConfig(uid, configId);
  }
}
