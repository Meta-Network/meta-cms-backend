import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pipeline')
@Controller('v1/pipelines/site-tasks')
export class SiteTasksController {}
