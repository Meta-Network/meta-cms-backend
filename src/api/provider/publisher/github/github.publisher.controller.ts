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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

import { SkipUCenterAuth, User } from '../../../../decorators';
import { GitHubPublisherProviderEntity } from '../../../../entities/provider/publisher/github.entity';
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
  PatchMethodValidation,
  PostMethodValidation,
} from '../../../../utils/validation';
import { GitHubPublisherService } from './github.publisher.service';

class GitHubPublisherResponse extends TransformResponse<GitHubPublisherProviderEntity> {
  @ApiProperty({ type: GitHubPublisherProviderEntity })
  readonly data: GitHubPublisherProviderEntity;
}

class GitHubPublisherDeleteResponse extends TransformResponse<DeleteResult> {
  @ApiProperty({ type: DeleteResult })
  readonly data: DeleteResult;
}

@ApiTags('publisher')
@Controller('publisher/github')
export class GitHubPublisherController {
  constructor(private readonly publisherService: GitHubPublisherService) {}

  @ApiOkResponse({ type: GitHubPublisherResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When Publisher type or provider id not found',
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
  async getPublisherConfig(
    @User('id', ParseIntPipe) userId: number,
    @Query('configId', ParseIntPipe) siteConfigId: number,
  ) {
    return await this.publisherService.getPublisherConfig(userId, siteConfigId);
  }

  @ApiCreatedResponse({ type: GitHubPublisherResponse })
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
    description: 'When Publisher type and provider id already exists',
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
  async createPublisherConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) siteConfigId: number,
    @Body() createDto: GitHubPublisherProviderEntity,
  ) {
    return await this.publisherService.createPublisherConfig(
      user.id,
      siteConfigId,
      createDto,
    );
  }

  @ApiOkResponse({ type: GitHubPublisherResponse })
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
    description: 'When Publisher type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When Publisher data not found',
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
  @UsePipes(new ValidationPipe(PatchMethodValidation))
  async updatePublisherConfig(
    @User() user: UCenterJWTPayload,
    @Query('configId', ParseIntPipe) configId: number,
    @Body() updateDto: GitHubPublisherProviderEntity,
  ) {
    const result = await this.publisherService.updatePublisherConfig(
      user.id,
      configId,
      updateDto,
    );

    return result;
  }

  @ApiOkResponse({ type: GitHubPublisherDeleteResponse })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When request site config not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When Publisher type or provider id not found',
  })
  @ApiNotFoundResponse({
    type: DataNotFoundException,
    description: 'When Publisher data not found',
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
  async deletePublisherConfig(
    @User('id', ParseIntPipe) uid: number,
    @Query('configId', ParseIntPipe) configId: number,
  ) {
    return await this.publisherService.deletePublisherConfig(uid, configId);
  }

  // private async addGitHubWorkerTask(
  //   type: BullProcessorType,
  //   configId: number,
  //   user: UCenterJWTPayload,
  //   github: GitHubPublisherProviderEntity,
  // ): Promise<void> {
  //   // await this.taskService.addGitWorkerQueue(type, workerConfig);
  // }
}
