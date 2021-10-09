import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';

import { PostEntity } from '../../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { PostState } from '../../enums/postState';
import {
  AccessDeniedException,
  InvalidStatusException,
} from '../../exceptions';
import { UCenterJWTPayload } from '../../types';
import { TaskCommonState } from '../../types/enum';
import { SiteConfigLogicService } from '../site/config/logicService';
import { TasksService } from '../task/tasks.service';
import { PublishPostDto } from './dto/publish-post.dto';
import { PreProcessorService } from './preprocessor/preprocessor.service';
import { MatatakiSourceService } from './sources/matataki/matataki-source.service';

@Injectable()
export class PostService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(PostSiteConfigRelaEntity)
    private readonly postSiteConfigRepository: Repository<PostSiteConfigRelaEntity>,
    private readonly siteConfigLogicService: SiteConfigLogicService,
    private readonly preprocessorService: PreProcessorService,
    private readonly matatakiSourceService: MatatakiSourceService,
    private readonly tasksService: TasksService,
  ) {}

  async getPostsByUserId(
    userId: number,
    state: PostState,
    options: IPaginationOptions,
  ) {
    return await paginate<PostEntity>(this.postRepository, options, {
      where: {
        userId,
        state,
      },
      relations: ['siteConfigRelas'],
    });
  }

  async getPendingPostsByUserId(userId: number, options: IPaginationOptions) {
    return await this.getPostsByUserId(userId, PostState.Pending, options);
  }

  async setPostState(postId: number, state: PostState) {
    const post = await this.postRepository.findOneOrFail(postId);
    post.state = state;

    await this.postRepository.save(post);

    return post;
  }

  async publishPendingPost(
    user: Partial<UCenterJWTPayload>,
    postId: number,
    publishPostDto: PublishPostDto,
  ) {
    this.logger.verbose(
      `Find the post to publish postId: ${postId}`,
      this.constructor.name,
    );

    const post = await this.postRepository.findOneOrFail(postId);
    if (post.userId !== user.id) {
      throw new AccessDeniedException('access denied, user id inconsistent');
    }

    if (post.state !== PostState.Pending) {
      throw new InvalidStatusException('invalid post state');
    }

    await this.siteConfigLogicService.validateSiteConfigsUserId(
      publishPostDto.configIds,
      user.id,
    );

    const sourceService = this.getSourceService(post.platform);
    this.logger.verbose(
      `Fetching source content postId: ${postId}`,
      this.constructor.name,
    );

    const sourceContent = await sourceService.fetch(post.source);
    this.logger.verbose(
      `Preprocess source content postId: ${postId}`,
      this.constructor.name,
    );

    const processedContent = await this.preprocessorService.preprocess(
      sourceContent,
    );
    const relas = publishPostDto.configIds.map(
      (configId) =>
        ({
          siteConfig: {
            id: configId,
          },
          post: {
            id: postId,
          },
          state: TaskCommonState.DOING,
        } as Partial<PostSiteConfigRelaEntity>),
    );
    this.logger.verbose(
      `Saving post site config relations postId: ${postId}`,
      this.constructor.name,
    );

    await this.postSiteConfigRepository.save(relas);

    for (const postSiteConfigRela of relas) {
      const postInfo = {
        title: post.title,
        source: processedContent,
        cover: post.cover,
        summary: post.summary,
        category: post.category,
        tags: post.tags,
        createdAt: post.createdAt.toUTCString(),
        updatedAt: post.updatedAt.toUTCString(),
      } as MetaWorker.Info.Post;
      try {
        this.logger.verbose(
          `Dispatching post site config relations postId: ${postId}`,
          this.constructor.name,
        );
        await this.tasksService.createPost(
          user,
          postInfo,
          postSiteConfigRela.siteConfig.id,
        );
        postSiteConfigRela.state = TaskCommonState.SUCCESS;
        await this.postSiteConfigRepository.save(postSiteConfigRela);
      } catch (err) {
        this.logger.error(
          `Create post fail: ${postId}`,
          err,
          this.constructor.name,
        );
        postSiteConfigRela.state = TaskCommonState.FAIL;
        await this.postSiteConfigRepository.save(postSiteConfigRela);
        throw err;
      }
    }
    post.state = PostState.Published;
    return await this.postRepository.save(post);
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
