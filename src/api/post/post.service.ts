import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';

import { PostEntity } from '../../entities/post.entity';
import { PostState } from '../../enums/postState';
import { PreProcessorService } from './preprocessor/preprocessor.service';
import { MatatakiSourceService } from './sources/matataki/matataki-source.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly preprocessorService: PreProcessorService,
    private readonly matatakiSourceService: MatatakiSourceService,
  ) {}

  async getPostsByUserId(userId: number, options: IPaginationOptions) {
    return await paginate<PostEntity>(this.postRepository, options, {
      where: {
        userId,
        state: PostState.Pending,
      },
    });
  }

  async setPostState(postId: number, state: PostState) {
    const post = await this.postRepository.findOneOrFail(postId);
    post.state = state;

    this.postRepository.save(post);

    return post;
  }

  async publish(postId: number) {
    const post = await this.postRepository.findOneOrFail(postId);
    const sourceService = this.getSourceService(post.platform);

    const sourceContent = await sourceService.fetch(post.source);
    const processedContent = await this.preprocessorService.preprocess(
      sourceContent,
    );

    // TODO: create hexo task
  }
  getSourceService(platform: string) {
    switch (platform) {
      case 'matataki':
        return this.matatakiSourceService;

      default:
        throw new Error('Invalid platform');
    }
  }
}
