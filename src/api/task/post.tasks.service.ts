import { MetaWorker } from '@metaio/worker-model';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { In, Repository, UpdateResult } from 'typeorm';

import { PostSiteConfigRelaEntity } from '../../entities/postSiteConfigRela.entity';
import { UCenterJWTPayload } from '../../types';
import { SiteStatus, TaskCommonState } from '../../types/enum';
import { processTitleWithHan } from '../../utils';
import { BaseTasksService } from './base.tasks.service';
import { TaskDispatchersService } from './workers/task-dispatchers.service';

@Injectable()
export class PostTasksService {
  constructor(
    @InjectRepository(PostSiteConfigRelaEntity)
    private readonly postSiteConfigRepository: Repository<PostSiteConfigRelaEntity>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly baseService: BaseTasksService,
    private readonly taskDispatchersService: TaskDispatchersService,
  ) {}

  public async createPost(
    user: Partial<UCenterJWTPayload>,
    posts: MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ): Promise<string> {
    const taskWorkspace =
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
    const postKeys = posts.map((p) => processTitleWithHan(p.title));
    await this.updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
      siteConfigId,
      postKeys,
      taskWorkspace,
    );
    // No longer waiting for Worker execution to complete
    this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doCreatePost(user, posts, siteConfigId, options),
      options,
    );
    return taskWorkspace;
  }

  public async updatePost(
    user: Partial<UCenterJWTPayload>,
    posts: MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ): Promise<string> {
    const taskWorkspace =
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
    const postKeys = posts.map((p) => processTitleWithHan(p.title));
    await this.updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
      siteConfigId,
      postKeys,
      taskWorkspace,
    );
    // No longer waiting for Worker execution to complete
    this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doUpdatePost(user, posts, siteConfigId, options),
      options,
    );
    return taskWorkspace;
  }

  public async deletePost(
    user: Partial<UCenterJWTPayload>,
    posts: MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft: boolean;
      isLastTask: boolean;
    },
  ): Promise<string> {
    const taskWorkspace =
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
    const postKeys = posts.map((p) => processTitleWithHan(p.title));
    await this.updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
      siteConfigId,
      postKeys,
      taskWorkspace,
    );
    // No longer waiting for Worker execution to complete
    this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doDeletePost(user, posts, siteConfigId, options),
      options,
    );
    return taskWorkspace;
  }

  public async publishDraft(
    user: Partial<UCenterJWTPayload>,
    posts: MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isLastTask: boolean;
    },
  ): Promise<string> {
    const taskWorkspace =
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
    const postKeys = posts.map((p) => processTitleWithHan(p.title));
    await this.updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
      siteConfigId,
      postKeys,
      taskWorkspace,
    );
    // No longer waiting for Worker execution to complete
    this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doPublishDraft(user, posts, siteConfigId),
      options,
    );
    return taskWorkspace;
  }

  public async moveToDraft(
    user: Partial<UCenterJWTPayload>,
    posts: MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isLastTask: boolean;
    },
  ): Promise<string> {
    const taskWorkspace =
      await this.taskDispatchersService.checkAndGetSiteConfigTaskWorkspace(
        siteConfigId,
      );
    const postKeys = posts.map((p) => processTitleWithHan(p.title));
    await this.updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
      siteConfigId,
      postKeys,
      taskWorkspace,
    );
    // No longer waiting for Worker execution to complete
    this.doCheckoutCommitPush(
      user,
      siteConfigId,
      async () => await this.doMoveToDraft(user, posts, siteConfigId),
      options,
    );
    return taskWorkspace;
  }

  private async doCheckoutCommitPush(
    user: Partial<UCenterJWTPayload>,
    siteConfigId: number,
    dispatchTaskFunc: () => Promise<any>,
    options?: {
      isLastTask: boolean;
    },
  ) {
    // Get task workspace
    const taskWorkspace =
      await this.taskDispatchersService.tryGetSiteConfigTaskWorkspaceLock(
        siteConfigId,
      );
    // Update task state: DOING
    await this.updatePostSiteConfigRelaStateByTaskWorkspace(
      siteConfigId,
      taskWorkspace,
      TaskCommonState.DOING,
    );

    // Do the work
    try {
      const { deployConfig } =
        await this.baseService.generateDeployConfigAndRepoSize(
          user,
          siteConfigId,
          [SiteStatus.Deployed, SiteStatus.Publishing, SiteStatus.Published],
        );
      const checkoutTaskSteps: MetaWorker.Enums.TaskMethod[] = [
        MetaWorker.Enums.TaskMethod.GIT_CLONE_CHECKOUT,
      ];
      this.logger.verbose(
        `Adding checkout worker to queue`,
        this.constructor.name,
      );

      const checkoutTaskStepResults =
        await this.taskDispatchersService.dispatchTask(
          checkoutTaskSteps,
          deployConfig,
          //必定不是最后一个任务，这里不能退出
        );

      const commitPushTaskSteps: MetaWorker.Enums.TaskMethod[] = [
        MetaWorker.Enums.TaskMethod.GIT_COMMIT_PUSH,
      ];
      const taskStepResults = await dispatchTaskFunc();
      this.logger.verbose(
        `Adding commit&push worker to queue`,
        this.constructor.name,
      );

      const commitPushTaskStepResults =
        await this.taskDispatchersService.dispatchTask(
          commitPushTaskSteps,
          deployConfig,
          options?.isLastTask,
        );

      // Update task state: SUCCESS
      await this.updatePostSiteConfigRelaStateByTaskWorkspace(
        siteConfigId,
        taskWorkspace,
        TaskCommonState.SUCCESS,
      );

      return Object.assign(
        checkoutTaskStepResults,
        taskStepResults,
        commitPushTaskStepResults,
      );
    } catch (error) {
      this.logger.error(
        `Do checkout commit push failed`,
        error,
        this.constructor.name,
      );
      // Update task state: FAIL
      await this.updatePostSiteConfigRelaStateByTaskWorkspace(
        siteConfigId,
        taskWorkspace,
        TaskCommonState.FAIL,
      );
    }
  }

  private async doCreatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft?: boolean;
    },
  ) {
    const { postConfig, template } =
      await this.baseService.generatePostConfigAndTemplate(
        user,
        post,
        siteConfigId,
      );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding post creator worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getCreatePostTaskMethodsByTemplateType(
        templateType,
        options?.isDraft,
      ),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
      // 必定不是最后一个任务
    );
  }

  private async doUpdatePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
    options?: {
      isDraft?: boolean;
    },
  ) {
    const { postConfig, template } =
      await this.baseService.generatePostConfigAndTemplate(
        user,
        post,
        siteConfigId,
      );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding post updater worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getUpdatePostTaskMethodsByTemplateType(
        templateType,
        options?.isDraft,
      ),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
      // 必定不是最后一个任务
    );
  }

  private async doDeletePost(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
    options: { isDraft: boolean },
  ) {
    const { postConfig, template } =
      await this.baseService.generatePostConfigAndTemplate(
        user,
        post,
        siteConfigId,
      );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding post delete worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getDeletePostTaskMethodsByTemplateType(
        templateType,
        options?.isDraft,
      ),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
      // 必定不是最后一个任务
    );
  }

  private async doPublishDraft(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
  ) {
    const { postConfig, template } =
      await this.baseService.generatePostConfigAndTemplate(
        user,
        post,
        siteConfigId,
      );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding publish draft worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getPublishDraftTaskMethodsByTemplateType(templateType),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
    );
  }

  private async doMoveToDraft(
    user: Partial<UCenterJWTPayload>,
    post: MetaWorker.Info.Post | MetaWorker.Info.Post[],
    siteConfigId: number,
  ) {
    const { postConfig, template } =
      await this.baseService.generatePostConfigAndTemplate(
        user,
        post,
        siteConfigId,
      );
    const templateType = template.templateType;
    this.logger.verbose(
      `Adding move post to draft worker to queue`,
      this.constructor.name,
    );
    const postTaskSteps = [];

    postTaskSteps.push(
      ...this.getMoveToDraftTaskMethodsByTemplateType(templateType),
    );

    return await this.taskDispatchersService.dispatchTask(
      postTaskSteps,
      postConfig,
    );
  }

  // #region TaskMethods
  private getCreatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
    draftFlag = false,
  ): MetaWorker.Enums.TaskMethod[] {
    // 2021-12-20 by whyyouare: Use UPDATE for create task
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      if (draftFlag) {
        return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_DRAFT];
      }
      return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_POST];
    }
  }
  private getUpdatePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
    draftFlag = false,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      if (draftFlag) {
        return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_DRAFT];
      }
      return [MetaWorker.Enums.TaskMethod.HEXO_UPDATE_POST];
    }
  }
  private getDeletePostTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
    draftFlag = false,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      if (draftFlag) {
        throw new Error('Function not implemented.'); // TODO(550): Draft Support
      }
      return [MetaWorker.Enums.TaskMethod.HEXO_DELETE_POST];
    }
  }
  private getPublishDraftTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      return [MetaWorker.Enums.TaskMethod.HEXO_PUBLISH_DRAFT];
    }
  }
  private getMoveToDraftTaskMethodsByTemplateType(
    templateType: MetaWorker.Enums.TemplateType,
  ): MetaWorker.Enums.TaskMethod[] {
    // HEXO
    if (MetaWorker.Enums.TemplateType.HEXO === templateType) {
      return [MetaWorker.Enums.TaskMethod.HEXO_MOVETO_DRAFT];
    }
  }
  // #endregion TaskMethods

  private async updatePostSiteConfigRelaTaskWorkspaceBySiteConfigId(
    siteConfigId: number,
    postKeys: string[],
    taskWorkspace: string,
  ): Promise<UpdateResult> {
    return await this.postSiteConfigRepository.update(
      {
        siteConfig: {
          id: siteConfigId,
        },
        postTitle: In(postKeys),
      },
      {
        taskWorkspace,
      },
    );
  }

  private async updatePostSiteConfigRelaStateByTaskWorkspace(
    siteConfigId: number,
    taskWorkspace: string,
    state: TaskCommonState,
  ): Promise<UpdateResult> {
    return await this.postSiteConfigRepository.update(
      {
        siteConfig: {
          id: siteConfigId,
        },
        taskWorkspace,
      },
      {
        state,
      },
    );
  }
}
