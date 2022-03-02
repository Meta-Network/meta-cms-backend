import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { SkipAllAuth } from '../../../decorators';
import { ValidationException } from '../../../exceptions';
import { TransformCreatedResponse } from '../../../utils/responseClass';
import { PostMethodValidation } from '../../../utils/validation';
import {
  ManagementAuthorizationDto,
  ManagementAuthorizationWithToken,
} from './dto';
import { ManagementAuthorizationService } from './service';

class ManagementAuthorizationResponse extends TransformCreatedResponse<ManagementAuthorizationWithToken> {
  @ApiProperty({ type: ManagementAuthorizationWithToken })
  readonly data: ManagementAuthorizationWithToken;
}

@ApiTags('management')
@Controller('management')
export class ManagementAuthorizationController {
  constructor(private readonly service: ManagementAuthorizationService) {}

  @ApiCreatedResponse({ type: ManagementAuthorizationResponse })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When the fields in the request body does not pass type validation',
  })
  @Post('login')
  @SkipAllAuth()
  @UsePipes(new ValidationPipe(PostMethodValidation))
  public async login(@Body() authDto: ManagementAuthorizationDto) {
    return this.service.login(authDto);
  }
}
