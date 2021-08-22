import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  LoggerService,
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
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DeleteResult } from 'typeorm';

import { BullProcessorType } from '../../../../constants';
import { User } from '../../../../decorators';
import { GitHubStorageProviderEntity } from '../../../../entities/provider/storage/github.entity';
import {
  AccessDeniedException,
  DataAlreadyExistsException,
  DataNotFoundException,
  RelationNotFoundException,
  ValidationException,
} from '../../../../exceptions';
import { UCenterJWTPayload } from '../../../../types';
import { TransformResponse } from '../../../../utils/responseClass';
import { GitHubStorageLogicService } from '../../../provider/storage/github/logicService';
import { TasksService } from '../../../task/service';

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
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly logicService: GitHubStorageLogicService,
    private readonly taskService: TasksService,
  ) {}

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
  @ApiQuery({
    name: 'configId',
    type: Number,
    example: 1,
    description: 'Site config id',
  })
  @Post()
  async createStorageConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() createDto: GitHubStorageProviderEntity,
  ) {
    const result = await this.logicService.createStorageConfig(
      user.id,
      configId,
      createDto,
    );

    await this.taskService.addGitWorkerQueue(
      BullProcessorType.CREATE_SITE,
      configId,
      user,
      result,
    );

    return result;
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
    @Body() updateDto: GitHubStorageProviderEntity,
  ) {
    const result = await this.logicService.updateStorageConfig(
      user.id,
      configId,
      updateDto,
    );

    // Update config should run Hexo worker
    // await this.addGitWorkerQueue(
    //   BullProcessorType.UPDATE_SITE,
    //   configId,
    //   user,
    //   result,
    // );

    return result;
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
