import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { User } from '../../decorators';
import { PostEntity } from '../../entities/post.entity';
import { AccessDeniedException, RequirdHttpHeadersNotFoundException } from '../../exceptions';
import { TransformResponse } from '../../utils/responseClass';
import { PostService } from './post.service';

class PostListResponse extends TransformResponse<PostEntity> {
  @ApiProperty({ type: PostEntity, isArray: true })
  readonly data: PostEntity[];
}

@ApiTags('post')
@ApiCookieAuth()
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiOkResponse({ type: PostListResponse })
  @ApiBadRequestResponse({
    type: RequirdHttpHeadersNotFoundException,
    description: 'When cookie with access token not provided',
  })
  async getPosts(
    @User('id', ParseIntPipe) uid: number,
  ) {
    return await this.postService.getPostsByUserId(uid);
  }
}
