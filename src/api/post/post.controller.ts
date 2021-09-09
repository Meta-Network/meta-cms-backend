import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { User } from '../../decorators';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(
    @User('id', ParseIntPipe) uid: number,
  ) {
    return await this.postService.getPostsByUserId(uid);
  }
}
