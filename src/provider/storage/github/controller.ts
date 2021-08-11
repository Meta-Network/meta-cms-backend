import { DeleteResult } from 'typeorm';
import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../../decorators';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';
import {
  AccessDeniedException,
  DataAlreadyExistsException,
  DataNotFoundException,
  RelationNotFoundException,
  ValidationException,
} from '../../../exceptions';
import { TransformResponse } from '../../../utils/responseClass';
import { GitHubStorageLogicService } from './logicService';

class GitHubStorageResponse extends TransformResponse<GitHubStorageProviderEntity> {
  @ApiProperty({ type: GitHubStorageProviderEntity })
  readonly data: GitHubStorageProviderEntity;
}

class GitHubStorageDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('storage')
@Controller('storage/github')
export class GitHubStorageController {
  constructor(private readonly logicService: GitHubStorageLogicService) {}

  @ApiOkResponse({ type: GitHubStorageResponse })
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
  @ApiQuery({ name: 'configId', type: Number, example: 1 })
  @Get()
  async getStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.getStorageConfig(uid, configId);
  }

  @ApiCreatedResponse({ type: GitHubStorageResponse })
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
  @ApiQuery({ name: 'configId', type: Number, example: 1 })
  @Post()
  async createStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() createDto: GitHubStorageProviderEntity,
  ) {
    return await this.logicService.createStorageConfig(
      uid,
      configId,
      createDto,
    );
  }

  @ApiOkResponse({ type: GitHubStorageResponse })
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
  @ApiQuery({ name: 'configId', type: Number, example: 1 })
  @Patch()
  async updateStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() updateDto: GitHubStorageProviderEntity,
  ) {
    return await this.logicService.updateStorageConfig(
      uid,
      configId,
      updateDto,
    );
  }

  @ApiOkResponse({ type: GitHubStorageDeleteResponse })
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
  @ApiQuery({ name: 'configId', type: Number, example: 1 })
  @Delete()
  async deleteStorageConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.logicService.deleteStorageConfig(uid, configId);
  }
}
