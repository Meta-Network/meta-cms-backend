import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pipeline')
@Controller('v1/pipelines/post-tasks')
export class PostTasksController {}
