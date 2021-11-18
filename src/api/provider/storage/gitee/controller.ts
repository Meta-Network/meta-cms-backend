import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
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

import { User } from '../../../../decorators';
import { GiteeStorageProviderEntity } from '../../../../entities/provider/storage/gitee.entity';
import {
  AccessDeniedException,
  DataAlreadyExistsException,
  DataNotFoundException,
  RelationNotFoundException,
  ValidationException,
} from '../../../../exceptions';
import { UCenterJWTPayload } from '../../../../types';
import { TransformResponse } from '../../../../utils/responseClass';
import {
  PostMethodValidation,
  validatePatchRequestBody,
} from '../../../../utils/validation';
import { GiteeStorageLogicService } from './logicService';

class GiteeStorageResponse extends TransformResponse<GiteeStorageProviderEntity> {
  @ApiProperty({ type: GiteeStorageProviderEntity })
  readonly data: GiteeStorageProviderEntity;
}

class GiteeStorageDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('storage')
@ApiCookieAuth()
@Controller('storage/gitee')
export class GiteeStorageController {
  constructor(private readonly logicService: GiteeStorageLogicService) {}

  @ApiOkResponse({ type: GiteeStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Get()
  async getStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.getStorageConfig(uid, configId);
  }

  @ApiCreatedResponse({ type: GiteeStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiConflictResponse({
    type: DataAlreadyExistsException,
    description: 'When storage type and provider id already exists',
  })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Post()
  @UsePipes(new ValidationPipe(PostMethodValidation))
  async createStorageConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() createDto: GiteeStorageProviderEntity,
  ) {
    return await this.logicService.createStorageConfig(
      user.id,
      configId,
      createDto,
    );
  }

  @ApiOkResponse({ type: GiteeStorageResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage data not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Patch()
  async updateStorageConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() updateDto: GiteeStorageProviderEntity,
  ) {
    const validate = Object.assign(new GiteeStorageProviderEntity(), updateDto);
    await validatePatchRequestBody(validate);

    const result = await this.logicService.updateStorageConfig(
      user.id,
      configId,
      updateDto,
    );

    return result;
  }

  @ApiOkResponse({ type: GiteeStorageDeleteResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When storage data not found',
  })
  @ApiNotFoundResponse({
    type: RelationNotFoundException,
    description: 'When site info relation not found',
  })
  @ApiForbiddenResponse({
    type: AccessDeniedException,
    description: 'When request `userId` not match',
  })
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Delete()
  async deleteStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.deleteStorageConfig(uid, configId);
  }
}
