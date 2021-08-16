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
import { ValidationException } from 'src/exceptions';
import { ThemeTemplateEntity } from 'src/entities/themeTemplate.entity';
import { TemplateQueryType } from 'src/types/enum';
import { TransformResponse } from 'src/utils/responseClass';
import { TemplateLogicService } from 'src/theme/template/logicService';

class TemplateListResponse extends TransformResponse<ThemeTemplateEntity> {
  @ApiProperty({ type: ThemeTemplateEntity, isArray: true })
  readonly data: ThemeTemplateEntity[];
}

@ApiTags('theme')
@Controller('theme/template')
export class TemplateController {
  constructor(private readonly logicService: TemplateLogicService) {}

  @ApiOkResponse({ type: TemplateListResponse })
  @ApiBadRequestResponse({
    type: ValidationException,
    description:
      'When query param `findType` value not match enum `TemplateType`',
  })
  @ApiQuery({
    name: 'findType',
    enum: TemplateQueryType,
    example: TemplateQueryType.ALL,
  })
  @Get()
  async getTemplates(
    @Query(
      'findType',
      new DefaultValuePipe(TemplateQueryType.ALL),
      new ParseEnumPipe(TemplateQueryType),
    )
    findType: TemplateQueryType = TemplateQueryType.ALL,
  ) {
    return await this.logicService.getTemplates(findType);
  }
}
