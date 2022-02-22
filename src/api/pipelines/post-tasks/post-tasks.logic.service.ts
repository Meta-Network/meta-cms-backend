import { MetaWorker } from '@metaio/worker-model2';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';
import { DataNotFoundException } from '../../../exceptions';
import { UCenterUser } from '../../../types';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import { WorkerModel2StorageService } from '../../provider/storage/worker-model2.service';
import { WorkerModel2SiteService } from '../../site/worker-model2.service';
import { PostOrdersBaseService } from '../post-orders/post-orders.base.service';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostTasksBaseService } from './post-tasks.base.service';

@Injectable()
export class PostTasksLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly postTasksBaseService: PostTasksBaseService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly postOrdersBaseService: PostOrdersBaseService,
    private readonly siteService: WorkerModel2SiteService,
    private readonly storageService: WorkerModel2StorageService,
  ) {}

  async getById(id: string) {
    return await this.postTasksBaseService.getById(id);
  }

  async countUserDoingPostTask(userId: number): Promise<number> {
    return await this.postTasksBaseService.count({
      where: {
        userId,
        state: PipelineOrderTaskCommonState.DOING,
      },
    });
  }

  async generateUserPostTaskForPendingPosts(userId: number): Promise<{
    postTaskEntity: PostTaskEntity;
    postOrderEntities: PostOrderEntity[];
  }> {
    // 会产生空任务，相当于在没有postOrder的情况下创建了任务，方便测试，也好
    const id = this.newCreatePostsTaskId();
    this.logger.verbose(`Generate post task id ${id}`, this.constructor.name);
    const postTaskEntity = await this.postTasksBaseService.save({
      id,
      userId,
      state: PipelineOrderTaskCommonState.PENDING,
      // createdAt: new Date(),
      // updatedAt: new Date(),
    });

    await this.postOrdersBaseService.batchUpdate(
      {
        userId,
        submitState: PipelineOrderTaskCommonState.PENDING,
      },
      {
        postTaskId: id,
      },
    );
    const postOrderEntities = await this.postOrdersBaseService.find({
      where: {
        postTaskId: id,
      },
      relations: ['postMetadata'],
    });
    return {
      postTaskEntity,
      postOrderEntities,
    };
  }
  newCreatePostsTaskId(): string {
    // post 目前没指定site的
    return `wt4site-create-posts-${uuid()}`;
  }

  async doingPostTask(
    postTaskEntity: PostTaskEntity,
    postOrderEntities: PostOrderEntity[],
  ) {
    this.logger.verbose(
      `Doing post task postTaskId ${postTaskEntity.id} `,
      this.constructor.name,
    );
    postTaskEntity.state = PipelineOrderTaskCommonState.DOING;

    postOrderEntities.forEach((postOrderEntity) => {
      postOrderEntity.submitState = PipelineOrderTaskCommonState.DOING;
    });

    await this.postTasksBaseService.save(postTaskEntity);
    await this.postOrdersLogicService.doingSubmitPost(postTaskEntity.id);
  }

  async finishPostTask(postTaskId: string, publishSiteOrderId?: number) {
    this.logger.verbose(
      `Finish post task id ${postTaskId}  ${
        publishSiteOrderId ?? '& link publishSiteOrderId' + publishSiteOrderId
      } `,
      this.constructor.name,
    );
    await this.postTasksBaseService.update(postTaskId, {
      state: PipelineOrderTaskCommonState.FINISHED,
      publishSiteOrderId,
    });
    await this.postOrdersLogicService.finishSubmitPost(
      postTaskId,
      publishSiteOrderId,
    );
  }

  async failPostTask(id: string) {
    this.logger.verbose(
      `Updte post task state to ‘failed’ by id ${id}  `,
      this.constructor.name,
    );
    await this.postTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    // post order submit state 是单个处理的，但如果整体失败了，也是需要整体更新的
    await this.postOrdersLogicService.failSubmitPostByPostTaskId(id);
  }

  async updatePublishSiteOrderId(
    postTaskId: string,
    publishSiteOrderId: number,
  ) {
    this.logger.verbose(
      `Update post publishSiteOrderId to ${publishSiteOrderId} with postTaskId ${postTaskId} `,
      this.constructor.name,
    );
    await this.postTasksBaseService.update(postTaskId, {
      publishSiteOrderId,
    });
    await this.postOrdersLogicService.updatePublishOrderId(
      postTaskId,
      publishSiteOrderId,
    );
  }

  async updatePublishSiteTaskId(
    publishSiteOrderIds: number[],
    publishSiteTaskId: string,
  ) {
    this.logger.verbose(
      `Update post publishSiteTaskId to ${publishSiteTaskId} with publishSiteOrderId ${publishSiteOrderIds} `,
      this.constructor.name,
    );
    await this.postTasksBaseService.batchUpdate(
      {
        publishSiteOrderId: In(publishSiteOrderIds),
        publishSiteTaskId: '',
      },
      { publishSiteTaskId },
    );
    await this.postOrdersLogicService.updatePublishSiteTaskId(
      publishSiteOrderIds,
      publishSiteTaskId,
    );
  }

  public async generatePostConfigAndTemplate(
    user: Partial<UCenterUser>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    configId: number,
  ): Promise<{
    postConfig: MetaWorker.Configs.PostConfig;
    template: MetaWorker.Info.Template;
  }> {
    this.logger.verbose(
      `Generate meta worker site info`,
      this.constructor.name,
    );

    const { site, template, storage } =
      await this.siteService.generateMetaWorkerSiteInfo(user, configId, [
        SiteStatus.Deployed,
        SiteStatus.Publishing,
        SiteStatus.Published,
        SiteStatus.PublishFailed,
      ]);
    const { storageProviderId, storageType } = storage;
    if (!storageProviderId)
      throw new DataNotFoundException('storage provider id not found');
    const { gitInfo } = await this.storageService.generateMetaWorkerGitInfo(
      storageType,
      user.id,
      storageProviderId,
    );
    const postConfig: MetaWorker.Configs.PostConfig = {
      user: {
        username: user.username,
        nickname: user.nickname,
      },
      site,
      post,
      git: {
        storage: gitInfo,
      },
    };
    return {
      postConfig,
      template,
    };
  }
}
