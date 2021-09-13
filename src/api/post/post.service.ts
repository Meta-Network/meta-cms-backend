import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { PostEntity } from '../../entities/post.entity';
import { PostState } from '../../enums/postState';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>
  ) { }

  async getPostsByUserId(userId: number, options: IPaginationOptions) {
    return await paginate<PostEntity>(this.postRepository, options, {
      where: {
        userId,
        state: PostState.Pending,
      },
    });
  }
}
