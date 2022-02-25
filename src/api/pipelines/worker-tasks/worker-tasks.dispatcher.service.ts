import { MetaInternalResult } from '@metaio/microservice-model';
import { MetaWorker } from '@metaio/worker-model2';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Queue } from 'bull';
import { isEmpty } from 'class-validator';
import moment from 'moment';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { v4 as uuid } from 'uuid';

import { configBuilder } from '../../../configs';
import { DeploySiteOrderEntity } from '../../../entities/pipeline/deploy-site-order.entity';
import { DeploySiteTaskEntity } from '../../../entities/pipeline/deploy-site-task.entity';
import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { PostTaskEntity } from '../../../entities/pipeline/post-task.entity';
import { PublishSiteOrderEntity } from '../../../entities/pipeline/publish-site-order.entity';
import { IWorkerTask } from '../../../entities/pipeline/worker-task.interface';
import {
  DataNotFoundException,
  InvalidStatusException,
} from '../../../exceptions';
import { UCenterUser } from '../../../types';
import { PipelineOrderTaskCommonState, SiteStatus } from '../../../types/enum';
import {
  WorkerModel2Config,
  WorkerModel2TaskConfig,
  WorkModel2PostTaskResult,
} from '../../../types/worker-model2';
import { iso8601ToDate } from '../../../utils';
import { MetaUCenterService } from '../../microservices/meta-ucenter/meta-ucenter.service';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { PostTasksLogicService } from '../post-tasks/post-tasks.logic.service';
import { SiteOrdersLogicService } from '../site-orders/site-orders.logic.service';
import { SiteTasksLogicService } from '../site-tasks/site-tasks.logic.service';
import {
  WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR,
  WORKER_TASKS_JOB_PROCESSOR,
  WorkerTasksDispatchNextJobDetail,
  WorkerTasksJobDetail,
} from './processors/worker-tasks.job-processor';

const config = configBuilder();
const requestNextTaskIntervalMs = config?.pipeline?.dispatcher
  ?.requestNextTaskIntervalMs as number;
if (!requestNextTaskIntervalMs) {
  throw new Error(`No config: pipeline.dispatcher.requestNextTaskIntervalMs`);
}
@Injectable()
export class WorkerTasksDispatcherService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
    private readonly postTasksLogicService: PostTasksLogicService,
    private readonly siteOrdersLogicService: SiteOrdersLogicService,
    private readonly siteTasksLogicService: SiteTasksLogicService,
    private readonly siteConfigLogicService: SiteConfigLogicService,

    @InjectQueue(WORKER_TASKS_JOB_PROCESSOR)
    private readonly workerTasksQueue: Queue<WorkerTasksJobDetail>,
    @InjectQueue(WORKER_TASKS_DISPATCH_NEXT_JOB_PROCESSOR)
    private readonly workerTasksDispatchNextQueue: Queue<WorkerTasksDispatchNextJobDetail>,
    private readonly ucenterService: MetaUCenterService,
  ) {
    [
      'pipeline.dispatcher.autoDispatchWorkerTask',
      'pipeline.dispatcher.wipLimit',
      'pipeline.dispatcher.number',
    ].forEach((configKey) => {
      const configValue = this.configService.get(configKey);
      if (configValue === undefined || configValue === null) {
        throw new Error(`No config: ${configKey}`);
      }
    });
  }

  async hasTaskInProgress(userId: number): Promise<boolean> {
    return (
      (await this.siteTasksLogicService.countUserDoingPublishSiteTask(userId)) >
        0 ||
      (await this.siteTasksLogicService.countUserDoingDeploySiteTask(userId)) >
        0 ||
      (await this.postTasksLogicService.countUserDoingPostTask(userId)) > 0
    );
  }

  async dispatchDeploySiteTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ): Promise<DeploySiteTaskEntity> {
    this.logger.verbose(
      `Dispatch deploy site task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );

    const siteConfigEntity =
      await this.siteConfigLogicService.validateSiteConfigUserId(
        siteConfigId,
        userId,
      );

    const deploySiteOrderEntity =
      await this.siteOrdersLogicService.getDeploySiteOrderBySiteConfigUserId(
        siteConfigId,
        userId,
      );
    //如果这里获取不到，应该直接返回 (说明派工有问题，应该在此之前就控制住)
    if (!deploySiteOrderEntity?.id) {
      throw new DataNotFoundException('Deploy site order not found');
    }
    // 如果站点是失败状态，直接重试，先更新状态
    if (SiteStatus.DeployFailed === siteConfigEntity?.status) {
      deploySiteOrderEntity.state = PipelineOrderTaskCommonState.PENDING;
      siteConfigEntity.status = SiteStatus.Configured;
      await this.siteOrdersLogicService.updateDeploySiteOrderState(
        deploySiteOrderEntity.id,
        deploySiteOrderEntity.state,
      );
      await this.siteConfigLogicService.updateSiteConfigStatus(
        siteConfigId,
        SiteStatus.Configured,
      );
    }
    // 只有站点在Configured状态才可以创建建站任务,所以如果状态不对直接做其他处理
    // 这里没有else，是为了承接上一步可能有的状态修改
    if (SiteStatus.Configured !== siteConfigEntity?.status) {
      this.logger.error(
        `SiteConfigId ${siteConfigId} userId ${userId} SiteStatus ${siteConfigEntity.status}. `,
      );
      throw new InvalidStatusException(
        `Invalid site status ${siteConfigEntity.status}`,
      );
    }
    const { deploySiteTaskEntity } =
      await this.siteTasksLogicService.generateDeploySiteTask(
        siteConfigId,
        userId,
      );
    deploySiteOrderEntity.deploySiteTaskId = deploySiteTaskEntity.id;
    await this.siteOrdersLogicService.updateDeploySiteOrderTaskId(
      deploySiteOrderEntity.id,
      deploySiteOrderEntity.deploySiteTaskId,
    );
    deploySiteTaskEntity.workerName = this.getWorkerName();
    deploySiteTaskEntity.workerSecret = this.newWorkerSecret();

    // 因为获取token等动作有可能失败，失败后要更新状态，更新条件中有要求submitState是doing，所以开始这种操作之前都先更新一次状态
    await this.siteTasksLogicService.doingDeploySiteTask(deploySiteTaskEntity);
    try {
      const user = await this.getUserInfo(userId);

      const { deployConfig } =
        await this.siteTasksLogicService.generateDeployConfigAndRepoEmpty(
          user,
          siteConfigId,
        );

      await this.dispatchTask(
        deploySiteTaskEntity,
        MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE,
        deployConfig.template,
        deployConfig,
        autoFailed,
      );
      return deploySiteTaskEntity;
    } catch (err) {
      //有可能因为获取不到GitHub OAuth token等原因导致失败。这种情况下直接标记任务为失败返回
      this.logger.error(err.message);
      await this.siteTasksLogicService.failDeploySiteTask(
        deploySiteTaskEntity.id,
      );
      this.requestNextTask({
        previousTaskId: deploySiteTaskEntity.id,
      });
      // throw err;
    } finally {
      this.logger.verbose(`Dispatch deploy site task finished`);
    }
  }

  async dispatchCreatePostsTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ): Promise<PostTaskEntity> {
    this.logger.verbose(
      `Dispatch create posts task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );
    const siteConfigEntity =
      await this.siteConfigLogicService.validateSiteConfigUserId(
        siteConfigId,
        userId,
      );
    if (
      !siteConfigEntity?.status ||
      SiteStatus.Configured === siteConfigEntity.status ||
      SiteStatus.Deploying === siteConfigEntity.status ||
      SiteStatus.DeployFailed === siteConfigEntity.status ||
      SiteStatus.Publishing === siteConfigEntity.status
    ) {
      throw new InvalidStatusException(
        `Invalid site status ${siteConfigEntity.status}`,
      );
    }
    // Deployed Published PublishFailed是可接受的状态
    const { postTaskEntity, postOrderEntities } =
      await this.postTasksLogicService.generateUserPostTaskForPendingPosts(
        userId,
      );

    postTaskEntity.workerName = this.getWorkerName();
    postTaskEntity.workerSecret = this.newWorkerSecret();
    // 因为获取token等动作有可能失败，失败后要更新状态，更新条件中有要求submitState是doing，所以开始这种操作之前都先更新一次状态
    await this.postTasksLogicService.doingPostTask(
      postTaskEntity,
      postOrderEntities,
    );

    try {
      const user = await this.getUserInfo(userId);
      const posts = [];
      for (let i = 0; i < postOrderEntities.length; i++) {
        const postOrderEntity = postOrderEntities[i];
        const postMetaDataEntity = postOrderEntity.postMetadata;
        const post = {
          id: postMetaDataEntity.id,
          title: postMetaDataEntity.title,
          cover: postMetaDataEntity.cover,
          summary: postMetaDataEntity.summary,
          source: postMetaDataEntity.content,
          categories: isEmpty(postMetaDataEntity.categories)
            ? []
            : postMetaDataEntity.categories.split(','),

          tags: isEmpty(postMetaDataEntity.tags)
            ? []
            : postMetaDataEntity.tags.split(','),

          license: postMetaDataEntity.license,

          serverVerificationMetadataStorageType:
            postOrderEntity.certificateStorageType,
          serverVerificationMetadataRefer: postOrderEntity.certificateId,
          createdAt: iso8601ToDate(postOrderEntity.createdAt).toISOString(),
          updatedAt: iso8601ToDate(postOrderEntity.updatedAt).toISOString(),
        } as unknown as MetaWorker.Info.Post;
        posts.push(post);
      }

      const { postConfig, template } =
        await this.postTasksLogicService.generatePostConfigAndTemplate(
          user,
          posts,
          siteConfigId,
        );

      await this.dispatchTask(
        postTaskEntity,
        MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS,
        template,
        postConfig,
        autoFailed,
      );
      return postTaskEntity;
    } catch (err) {
      //有可能因为获取不到GitHub OAuth token等原因导致失败。这种情况下直接标记任务为失败返回
      this.logger.error(err.message);
      await this.postTasksLogicService.failPostTask(postTaskEntity.id);
      this.requestNextTask({});
      // throw err;
    } finally {
      this.logger.verbose(`Dispatch create posts task finished`);
    }
  }

  getWorkerName() {
    const dispatcherNo = this.configService.get<number>(
      'pipeline.dispatcher.number',
    );
    return `meta-cms-worker-${dispatcherNo}-`;
  }
  newWorkerSecret(): string {
    return uuid();
  }

  async linkOrGeneratePublishSiteTask(siteConfigId: number, userId: number) {
    await this.siteTasksLogicService.linkOrGeneratePublishSiteTask(
      siteConfigId,
      userId,
    );
  }

  async dispatchPublishSiteTask(
    siteConfigId: number,
    userId: number,
    autoFailed?: boolean,
  ) {
    this.logger.verbose(
      `Dispatch publish site task siteConfigId ${siteConfigId} userId ${userId}`,
      this.constructor.name,
    );
    const siteConfigEntity =
      await this.siteConfigLogicService.validateSiteConfigUserId(
        siteConfigId,
        userId,
      );
    //如果已经在发布中了，而且就在10分钟内，确认一下
    //在自动机制上会导致对应的order没得到更新？一直找到同一个？需要尝试是否会导致重复处理
    const noResponse = moment(siteConfigEntity?.updatedAt).isBefore(
      moment().subtract(10, 'minutes'),
    );
    if (SiteStatus.Publishing === siteConfigEntity?.status && !noResponse) {
      this.logger.verbose(
        `SiteConfigId ${siteConfigId} may be publishing `,
        this.constructor.name,
      );
      const doingPublishSiteTask =
        await this.siteTasksLogicService.getDoingPublishSiteTask(
          siteConfigId,
          userId,
        );
      //如果确实找得到正在执行的任务，算异常派工?
      if (doingPublishSiteTask) {
        this.logger.error(
          `Dispatch publish site task siteConfigId ${siteConfigId} userId ${userId}: invalid site status ${siteConfigEntity?.status}`,
        );
        throw new InvalidStatusException(
          `invalid site status ${siteConfigEntity.status}`,
        );
      }
      //如果找不到，是站点状态不对，尝试修复
      else {
        siteConfigEntity.status = SiteStatus.PublishFailed;
        await this.siteConfigLogicService.updateSiteConfigStatus(
          siteConfigEntity.id,
          siteConfigEntity.status,
        );
      }
    }

    // 正常情况不会发生的，还没初始化成功就来发布的
    if (
      !siteConfigEntity?.status ||
      SiteStatus.Configured === siteConfigEntity?.status ||
      SiteStatus.Deploying === siteConfigEntity?.status ||
      SiteStatus.DeployFailed === siteConfigEntity?.status
    ) {
      this.logger.error(
        `Dispatch publish site task siteConfigId ${siteConfigId} userId ${userId}: invalid site status ${siteConfigEntity?.status}`,
      );
      throw new InvalidStatusException(
        `invalid site status ${siteConfigEntity.status}`,
      );
    }
    // 剩下的 Deployed Publishing Published PublishFailed是可以处理的
    // 用于兜底，产生一个publishSiteTask
    await this.linkOrGeneratePublishSiteTask(siteConfigId, userId);
    const { publishSiteTaskEntity } =
      await this.siteTasksLogicService.getPendingPublishSiteTask(
        siteConfigId,
        userId,
      );

    publishSiteTaskEntity.workerName = this.getWorkerName();
    publishSiteTaskEntity.workerSecret = this.newWorkerSecret();
    // 因为获取token等动作有可能失败，失败后要更新状态，更新条件中有要求submitState是doing，所以开始这种操作之前都先更新一次状态
    // 注意可以迁移的状态
    await this.siteTasksLogicService.doingPublishSiteTask(
      publishSiteTaskEntity,
    );

    try {
      const user = await this.getUserInfo(publishSiteTaskEntity.userId);

      const { publishConfig, template } =
        await this.siteTasksLogicService.generatePublishConfigAndTemplate(
          user,
          siteConfigId,
        );

      await this.dispatchTask(
        publishSiteTaskEntity,
        MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE,
        template,
        publishConfig,
        autoFailed,
      );

      // 处理完成不在这里，由worker来调用finishTask/failTask
      return publishSiteTaskEntity;
    } catch (err) {
      //有可能因为获取不到GitHub OAuth token等原因导致失败。这种情况下直接标记任务为失败后返回
      this.logger.error(err.message);
      await this.siteTasksLogicService.failPublishSiteTask(
        publishSiteTaskEntity.id,
      );
      this.requestNextTask({
        previousTaskId: publishSiteTaskEntity.id,
      });
      // throw err;
    } finally {
      this.logger.verbose(`Dispatch create publish site task finished`);
    }
  }

  async getUserInfo(userId: number): Promise<UCenterUser> {
    //TODO retry
    return await this.ucenterService.getUserInfo(userId);
  }

  async dispatchTask(
    workerTask: IWorkerTask,
    workerTaskMethod: MetaWorker.Enums.WorkerTaskMethod,
    template: MetaWorker.Info.Template,
    cfg: WorkerModel2Config,
    autoFailed?: boolean,
  ) {
    // console.log(cfg);
    if (!workerTaskMethod) {
      throw new BadRequestException('Worker task method must not be empty');
    }
    const jobDetail = await this.initMetaWorkerTasksJobDetail(
      workerTask,
      workerTaskMethod,
      template,
      cfg,
    );

    if (autoFailed) {
      await this.failTask(jobDetail.taskConfig);
    } else {
      try {
        // const jobId = uuid();
        // const workerName = `meta-cms-worker-${workerNo}`;
        const { workerSecret } = workerTask;
        // not including the actual execution time
        return await this.workerTasksQueue.add(jobDetail, {
          jobId: workerSecret,
        });
        // return await this.workerTasksJobProcessor.process(job);
      } catch (err) {
        this.logger.error(`Pipeline Exception: ${err}`, this.constructor.name);
        throw new InternalServerErrorException('Pipeline Exception');
      } finally {
        this.logger.verbose(
          `Dispatch task finished Queue active count: ${await this.workerTasksQueue.getActiveCount()} waiting count: ${await this.workerTasksQueue.getWaitingCount()}`,
          this.constructor.name,
        );
      }
    }
  }
  initMetaWorkerTasksJobDetail(
    workerTask: IWorkerTask,
    taskMethod: MetaWorker.Enums.WorkerTaskMethod,
    template: MetaWorker.Info.Template,
    cfg: WorkerModel2Config,
  ): WorkerTasksJobDetail {
    // const taskId = this.newTaskId(taskMethod);
    const { id: taskId, workerName } = workerTask;
    const task: MetaWorker.Info.Task = {
      taskId,
      taskMethod,
    };
    const taskConfig = {
      ...cfg,
      task,
    } as WorkerModel2TaskConfig;
    return {
      workerName,
      template,
      taskConfig,
    };
  }

  newTaskId(workerTaskMethod: MetaWorker.Enums.WorkerTaskMethod) {
    return `wt4site-${workerTaskMethod
      .toLowerCase()
      .replace('_', '-')}-${uuid()}`;
  }

  async getWorkerTaskById(
    auth: string,
    workerTaskId: string,
  ): Promise<WorkerModel2TaskConfig> {
    this.logger.verbose(
      `Get worker task by id ${workerTaskId} auth ${auth}`,
      this.constructor.name,
    );
    if (!auth) {
      throw new UnauthorizedException('Unauthorize');
    }

    const parts = auth.split(':');
    //workerName->base64 username,jobId->secret->base64 password
    const username = parts[0],
      jobId = parts[1];

    const job = await this.workerTasksQueue.getJob(jobId);
    if (
      job?.data?.workerName === username &&
      job?.data?.taskConfig?.task?.taskId === workerTaskId
    ) {
      this.logger.verbose(
        `Get worker task config ${JSON.stringify(job?.data?.taskConfig)}`,
      );
      return job?.data?.taskConfig;
    } else {
      throw new UnauthorizedException('Unauthorize');
    }
  }

  async report(
    auth: string,
    workerTaskId: string,
    taskReport: MetaWorker.Info.TaskReport<unknown>,
  ) {
    this.logger.verbose(
      `Worker ${workerTaskId} report ${taskReport.reason} reason on ${taskReport.timestamp}`,
      this.constructor.name,
    );
    const taskConfig = await this.getWorkerTaskById(auth, workerTaskId);
    const { taskMethod } = taskConfig.task;
    if (MetaWorker.Enums.TaskReportReason.HEALTH_CHECK === taskReport.reason) {
      // 不需要做什么，有上面的输出日志就可以
    } else if (
      MetaWorker.Enums.TaskReportReason.FINISHED === taskReport.reason
    ) {
      // 无论是成功结束还是失败结束都会进入这里，并不需要特别做什么
    } else if (
      // 会用这个方式上报的是POST局部失败的情况
      MetaWorker.Enums.TaskReportReason.ERRORED === taskReport.reason
    ) {
      this.logger.verbose(
        `Worker ${workerTaskId} report ${taskReport.reason} reason on ${
          taskReport.timestamp
        } data: ${JSON.stringify(taskReport.data)}`,
        this.constructor.name,
      );
      if (
        MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
        MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
        MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
      ) {
        const internalResult =
          taskReport.data as MetaInternalResult<WorkModel2PostTaskResult>;
        this.postOrdersLogicService.failSubmitPost(
          internalResult.data.id as string,
        );
      }
    }
  }

  async finishTask(taskConfig: WorkerModel2TaskConfig) {
    this.logger.verbose(
      `Finish task taskMethod ${taskConfig.task.taskMethod} taskId ${
        taskConfig.task.taskId
      } siteConfigId ${
        taskConfig.site.configId
      } Queue active count: ${await this.workerTasksQueue.getActiveCount()} waiting count: ${await this.workerTasksQueue.getWaitingCount()} completed count: ${await this.workerTasksQueue.getCompletedCount()}`,
      this.constructor.name,
    );
    const { taskMethod } = taskConfig.task;
    if (MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE === taskMethod) {
      const deploySiteTaskEntity =
        await this.siteTasksLogicService.getDeploySiteTaskById(
          taskConfig.task.taskId,
        );
      await this.siteTasksLogicService.finishDeploySiteTask(
        taskConfig.task.taskId,
      );
      //生成一个建站order
      const publishSiteOrderEntity =
        await this.siteOrdersLogicService.generatePublishSiteOrder(
          deploySiteTaskEntity.userId,
        );
    } else if (
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
    ) {
      const postTaskEntity = await this.postTasksLogicService.getById(
        taskConfig.task.taskId,
      );
      // let publishSiteOrderId;
      // if (taskConfig.site.enableAutoPublish) {
      const publishSiteOrderEntity =
        await this.siteOrdersLogicService.generatePublishSiteOrder(
          postTaskEntity.userId,
        );

      const publishSiteOrderId = publishSiteOrderEntity.id;
      // }
      await this.postTasksLogicService.finishPostTask(
        taskConfig.task.taskId,
        publishSiteOrderId,
      );
    } else if (MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE === taskMethod) {
      await this.siteTasksLogicService.finishPublishSiteTask(
        taskConfig as MetaWorker.Configs.PublishTaskConfig,
      );
    }
    // 异步拉动下一个任务
    this.requestNextTask({
      previousTaskId: taskConfig.task.taskId,
    } as WorkerTasksDispatchNextJobDetail);
  }
  async failTask(taskConfig: WorkerModel2TaskConfig) {
    this.logger.error(
      `Fail task taskMethod ${taskConfig.task.taskMethod} taskId ${
        taskConfig.task.taskId
      } siteConfigId ${
        taskConfig.site.configId
      } Queue active count: ${await this.workerTasksQueue.getActiveCount()} waiting count: ${await this.workerTasksQueue.getWaitingCount()} Failed count: ${await this.workerTasksQueue.getFailedCount()}`,
      this.constructor.name,
    );
    const { taskMethod } = taskConfig.task;
    if (MetaWorker.Enums.WorkerTaskMethod.DEPLOY_SITE === taskMethod) {
      await this.siteTasksLogicService.failDeploySiteTask(
        taskConfig.task.taskId,
      );
    } else if (
      MetaWorker.Enums.WorkerTaskMethod.CREATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.UPDATE_POSTS === taskMethod ||
      MetaWorker.Enums.WorkerTaskMethod.DELETE_POSTS === taskMethod
    ) {
      await this.postTasksLogicService.failPostTask(taskConfig.task.taskId);
    } else if (MetaWorker.Enums.WorkerTaskMethod.PUBLISH_SITE === taskMethod) {
      await this.siteTasksLogicService.failPublishSiteTask(
        taskConfig.task.taskId,
      );
    }
    // 异步拉动下一个任务
    this.requestNextTask({
      previousTaskId: taskConfig.task.taskId,
    } as WorkerTasksDispatchNextJobDetail);
  }

  async processTask(taskConfig: WorkerModel2TaskConfig) {
    const activeCount = await this.workerTasksQueue.getActiveCount(),
      waitingCount = await this.workerTasksQueue.getWaitingCount();
    this.logger.verbose(
      `Process task taskMethod ${taskConfig.task.taskMethod} taskId ${taskConfig.task.taskId} siteConfigId ${taskConfig.site.configId} Queue active count: ${activeCount} waiting count: ${waitingCount} `,
      this.constructor.name,
    );
    // 异步拉动下一个任务
    this.requestNextTask({
      previousTaskId: taskConfig.task.taskId,
    } as WorkerTasksDispatchNextJobDetail);
  }

  @Interval(requestNextTaskIntervalMs)
  async scheduleRequestNextTask() {
    await this.requestNextTask({});
  }

  async requestNextTask(
    workerTaskDispatchNextJobDetail: WorkerTasksDispatchNextJobDetail,
  ) {
    if (this.isAutoDispatchWorkerTaskEnabled()) {
      const activeCount =
          await this.workerTasksDispatchNextQueue.getActiveCount(),
        waitingCount =
          await this.workerTasksDispatchNextQueue.getWaitingCount();
      this.logger.verbose(
        `Next task request in queue: active count: ${activeCount} waiting count: ${waitingCount} `,
      );

      await this.workerTasksDispatchNextQueue.add(
        workerTaskDispatchNextJobDetail,
      );
    }
  }
  isAutoDispatchWorkerTaskEnabled() {
    return this.configService.get<boolean>(
      'pipeline.dispatcher.autoDispatchWorkerTask',
    );
  }

  isTaskCountLessThanWipLimit(activeCount: number, waitingCount: number) {
    return (
      activeCount + waitingCount <
      this.configService.get<number>('pipeline.dispatcher.wipLimit')
    );
  }

  async dispatchNextTask() {
    const activeCount = await this.workerTasksQueue.getActiveCount(),
      waitingCount = await this.workerTasksQueue.getWaitingCount();
    this.logger.debug(
      `Dispatch next task. Queue activeCount ${activeCount} waitingCount ${waitingCount}`,
    );
    if (this.isTaskCountLessThanWipLimit(activeCount, waitingCount)) {
      try {
        const pendingDeploySiteOrderEntity =
          await this.siteOrdersLogicService.getFirstPendingDeploySiteOrder();

        const pendingPublishSiteOrderEntity =
          await this.siteOrdersLogicService.getFirstPendingPublishSiteOrder();

        const pendingPostOrderEntity =
          await this.postOrdersLogicService.getFirstPendingPostOrder();
        await this.dispatchOldestOrder(
          pendingDeploySiteOrderEntity,
          pendingPublishSiteOrderEntity,
          pendingPostOrderEntity,
        );
      } catch (err) {
        this.logger.error(`Dispatch Next task err ${err.message}`, err);
        //TODO 根据派工异常信息做不同的善后
      }
    } else {
      this.logger.verbose(`WIP limit`);
    }
  }

  async dispatchOldestOrder(
    pendingDeploySiteOrderEntity: DeploySiteOrderEntity,

    pendingPublishSiteOrderEntity: PublishSiteOrderEntity,
    pendingPostOrderEntity: PostOrderEntity,
  ) {
    //如果同一个siteConfig连续多种类型的任务，可能并发
    const orderOptions = [
      pendingDeploySiteOrderEntity,
      pendingPublishSiteOrderEntity,
      pendingPostOrderEntity,
    ];
    this.logger.debug(`Order options ${JSON.stringify(orderOptions)}`);
    const createdAtArray = orderOptions
      .filter((item) => !isEmpty(item?.createdAt))
      .map((item) => item.createdAt.getTime()) as number[];
    const minCreatedAt = Math.min(...createdAtArray);
    if (
      pendingDeploySiteOrderEntity?.siteConfigId &&
      pendingDeploySiteOrderEntity?.createdAt.getTime() === minCreatedAt
    ) {
      this.logger.verbose(
        `Dispatch deploy site task based on ${JSON.stringify(
          pendingDeploySiteOrderEntity,
        )}`,
        this.constructor.name,
      );
      await this.dispatchDeploySiteTask(
        pendingDeploySiteOrderEntity?.siteConfigId,
        pendingDeploySiteOrderEntity?.userId,
      );

      return;
    }
    if (
      pendingPublishSiteOrderEntity?.siteConfigId &&
      pendingPublishSiteOrderEntity?.createdAt.getTime() === minCreatedAt
    ) {
      this.logger.verbose(
        `Dispatch publish site task based on ${JSON.stringify(
          pendingPublishSiteOrderEntity,
        )}`,
        this.constructor.name,
      );
      await this.dispatchPublishSiteTask(
        pendingPublishSiteOrderEntity?.siteConfigId,
        pendingPublishSiteOrderEntity?.userId,
      );
      return;
    }
    if (
      pendingPostOrderEntity?.userId &&
      pendingPostOrderEntity?.createdAt.getTime() === minCreatedAt
    ) {
      this.logger.verbose(
        `Dispatch post task based on ${JSON.stringify(pendingPostOrderEntity)}`,
        this.constructor.name,
      );
      const userDefaultSiteConfig =
        await this.siteOrdersLogicService.getUserDefaultSiteConfig(
          pendingPostOrderEntity.userId,
        );
      await this.dispatchCreatePostsTask(
        userDefaultSiteConfig?.id,
        pendingPostOrderEntity.userId,
      );
    }
  }
}
