import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
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
  ) {}

  async getById(id: string) {
    return await this.postTasksBaseService.getById(id);
  }

  async generateUserPostTaskForPendingPosts(userId: number): Promise<{
    postTaskEntity: PostTaskEntity;
    postOrderEntities: PostOrderEntity[];
  }> {
    //TODO 会产生空任务，相当于在没有postOrder的情况下创建了任务，是否要处理？
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

  async finishPostTask(postTaskId: string, publishSiteOrderId: number) {
    this.logger.verbose(
      `Finish post task id ${postTaskId} & link publishSiteOrderId ${publishSiteOrderId} `,
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
    this.logger.verbose(`Fail post task id ${id}  `, this.constructor.name);
    await this.postTasksBaseService.update(id, {
      state: PipelineOrderTaskCommonState.FAILED,
    });
    // post order submit state 是单个处理的，不在这里
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
}
