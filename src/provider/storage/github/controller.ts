import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('storage')
@Controller('storage/github')
export class GitHubStorageController {}
