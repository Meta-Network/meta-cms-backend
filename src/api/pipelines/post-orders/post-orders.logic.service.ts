import {
  authorPostDigest,
  authorPostDigestSign,
  serverVerificationSign,
  serverVerificationSignWithContent,
} from '@metaio/meta-signature-util-v2';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IPaginationMeta, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { In } from 'typeorm';

import { PostOrderEntity } from '../../../entities/pipeline/post-order.entity';
import { DataNotFoundException } from '../../../exceptions';
import { PostPublishNotification } from '../../../types';
import {
  InternalRealTimeEvent,
  MetadataStorageType,
  PipelineOrderTaskCommonState,
  RealTimeEventState,
} from '../../../types/enum';
import { MetaSignatureHelper } from '../../meta-signature/meta-signature.helper';
import { MetadataStorageService } from '../../provider/metadata-storage/metadata-storage.service';
import { InternalRealTimeMessage } from '../../real-time-event/real-time-event.datatype';
import {
  PostOrderRequestDto,
  PostOrderResponseDto,
} from '../dto/post-order.dto';
import {
  GENERATE_PUBLISH_SITE_ORDER_EVENT,
  GeneratePublishSiteOrderEvent,
} from '../event/site-order.event';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { PostOrdersBaseService } from './post-orders.base.service';

@Injectable()
export class PostOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly postOrdersBaseService: PostOrdersBaseService,
    private readonly serverVerificationBaseService: ServerVerificationBaseService,
    private readonly metadataStorageService: MetadataStorageService,
    private readonly metaSignatureHelper: MetaSignatureHelper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getFirstPendingPostOrder(): Promise<PostOrderEntity> {
    return await this.postOrdersBaseService
      .createQueryBuilder()
      .where('submitState = :submitState', {
        submitState: PipelineOrderTaskCommonState.PENDING,
      })
      .andWhere(`(certificateStorageType = '' OR certificateId != '')`)
      .andWhere(
        `NOT EXISTS (SELECT 1 from post_order_entity AS myPostOrderEntity WHERE (myPostOrderEntity.submitState In (:...myPostOrderEntitySubmitState) OR myPostOrderEntity.publishState In (:...myPostOrderEntityPublishState)) AND myPostOrderEntity.userId =postOrderEntity.userId)`,
        {
          myPostOrderEntitySubmitState: [PipelineOrderTaskCommonState.DOING],
          myPostOrderEntityPublishState: [PipelineOrderTaskCommonState.DOING],
        },
      )
      .andWhere(
        `NOT EXISTS (SELECT 1 from publish_site_order_entity AS publishSiteOrderEntity WHERE publishSiteOrderEntity.state In (:...publishSiteOrderEntityState) AND publishSiteOrderEntity.userId =postOrderEntity.userId)`,
        {
          publishSiteOrderEntityState: [PipelineOrderTaskCommonState.DOING],
        },
      )
      .orderBy({
        createdAt: 'ASC',
      })
      .getOne();
  }

  async pagiUserAllPostOrders(
    userId: number,
    options: IPaginationOptions<IPaginationMeta>,
  ) {
    return await this.postOrdersBaseService.pagiByQueryBuilder(
      this.postOrdersBaseService
        .createQueryBuilder()
        .leftJoinAndSelect('postOrderEntity.postMetadata', 'postMetadata')
        .where(`postOrderEntity.userId = :userId`, { userId })

        // .orderBy(
        //   `(CASE WHEN postOrderEntity.publishState = 'pending' THEN 2 WHEN postOrderEntity.publishState = 'doing' THEN 1 WHEN postOrderEntity.publishState = 'failed' THEN 3 WHEN postOrderEntity.publishState ='finished' THEN 4 ELSE null END)`,
        //   'ASC',
        // )

        .orderBy('postOrderEntity.createdAt', 'DESC'),

      options,
    );
  }

  async countUserPostOrders(
    userId: number,
  ): Promise<Record<PipelineOrderTaskCommonState, number>> {
    const rows = await this.postOrdersBaseService.count(userId);
    const result = {};
    rows.forEach((row) => {
      result[row.state] = parseInt(row.count);
    });
    return result as Record<PipelineOrderTaskCommonState, number>;
  }

  async countUserPostOrdersAsNotification(
    userId: number,
  ): Promise<PostPublishNotification> {
    const {
      [PipelineOrderTaskCommonState.PENDING]: pending = 0,
      [PipelineOrderTaskCommonState.DOING]: doing = 0,
      [PipelineOrderTaskCommonState.FINISHED]: finished = 0,
      [PipelineOrderTaskCommonState.FAILED]: failed = 0,
    } = await this.countUserPostOrders(userId);
    return {
      allPostCount: pending + doing + finished + failed,
      publishingCount: pending + doing,
      publishedCount: finished,
      publishingAlertFlag: failed > 0,
    };
  }

  async pagiUserPublishingPostOrders(
    userId: number,
    options: IPaginationOptions<IPaginationMeta>,
  ) {
    return await this.postOrdersBaseService.pagiByQueryBuilder(
      this.postOrdersBaseService
        .createQueryBuilder()
        .leftJoinAndSelect('postOrderEntity.postMetadata', 'postMetadata')
        .where(`postOrderEntity.userId = :userId`, { userId })
        .andWhere(`postOrderEntity.publishState In (:...publishStates)`, {
          publishStates: [
            PipelineOrderTaskCommonState.PENDING,
            PipelineOrderTaskCommonState.DOING,
          ],
        })
        // .orderBy(
        //   `(CASE WHEN postOrderEntity.publishState = 'pending' THEN 3 WHEN postOrderEntity.publishState = 'doing' THEN 1 WHEN postOrderEntity.publishState = 'failed' THEN 2 WHEN postOrderEntity.publishState ='finished' THEN 4 ELSE null END)`,
        //   'ASC',
        // )

        .orderBy('postOrderEntity.createdAt', 'DESC'),

      options,
    );
    //   options, {
    //   where: {
    //     userId,
    //     publishState: In([
    //       PipelineOrderTaskCommonState.PENDING,
    //       PipelineOrderTaskCommonState.DOING,
    //     ]),
    //   },
    //   order: {
    //     publishState: 'ASC',
    //     createdAt: 'ASC',
    //   },
    //   relations: ['postMetadata'],
    // });
  }
  async pagiUserPublishedPostOrders(
    userId: number,
    options: IPaginationOptions<IPaginationMeta>,
  ) {
    return await this.postOrdersBaseService.pagi(options, {
      where: {
        userId,
        publishState: PipelineOrderTaskCommonState.FINISHED,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['postMetadata'],
    });
  }

  async listUserFailedPostOrders(userId: number): Promise<PostOrderEntity[]> {
    return await this.postOrdersBaseService.find({
      where: {
        userId,
        publishState: PipelineOrderTaskCommonState.FAILED,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
  async retryUserFailedPostOrders(userId: number) {
    this.logger.verbose(`Retry user failed post orders userId ${userId}`);
    (await this.listUserFailedPostOrders(userId)).forEach((postOrderEntity) => {
      this.retryPostOrder(userId, postOrderEntity.id).catch((e) =>
        this.logger.error(
          `Retry user failed post order ${postOrderEntity.id} error ${e}`,
          PostOrdersLogicService.name,
        ),
      );
    });
  }

  async savePostOrder(
    userId: number,
    postOrderRequestDto: PostOrderRequestDto,
    states?: {
      submitState: PipelineOrderTaskCommonState;
      publishState: PipelineOrderTaskCommonState;
    },
  ): Promise<PostOrderResponseDto> {
    const digest = postOrderRequestDto.authorPostDigest;
    const sign = postOrderRequestDto.authorPostSign;
    let validAuthorPostDigest, validAuthorPostSign;
    try {
      validAuthorPostSign = authorPostDigestSign.verify(sign);
    } catch (err) {
      this.logger.error(`Invalid author post sign`, err);
    }
    if (!validAuthorPostSign) {
      throw new BadRequestException('Invalid author post sign');
    }
    try {
      validAuthorPostDigest = authorPostDigest.verify(digest);
    } catch (err) {
      this.logger.error(`Invalid author post digest`, err);
    }
    if (!validAuthorPostDigest) {
      throw new BadRequestException('Invalid author post digest');
    }
    const postOrderEntity = await this.postOrdersBaseService.getById(
      sign.signature,
    );
    if (postOrderEntity?.id) {
      throw new ConflictException('Already exists');
    }
    const serverVerification = serverVerificationSignWithContent.generate(
      digest,
      digest.digest,
      serverVerificationSign.generate(
        this.configService.get('metaSignature.serverKeys'),
        this.configService.get('metaSignature.serverDomain'),
        sign,
        sign.signature,
      ),
    );
    const postMetadata = {
      id: sign.signature,
      ...digest,
      authorPublicKey: sign.publicKey,
    };
    // ????????????????????????postOrder???????????????????????????????????????????????????????????????
    const createdPostOrder = this.postOrdersBaseService.create({
      id: sign.signature,
      userId,
      postMetadata,
      serverVerificationId: serverVerification.signature,
      ...states,
    });
    const serverVerificationPayload = JSON.stringify(serverVerification);
    await this.serverVerificationBaseService.save(
      serverVerification.signature,
      serverVerificationPayload,
    );
    const postOrder = await this.postOrdersBaseService.save(createdPostOrder);

    this.eventEmitter.emit(
      InternalRealTimeEvent.POST_STATE_UPDATED,
      new InternalRealTimeMessage({
        userId,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: [
          {
            id: sign.signature,
            submit: RealTimeEventState[postOrder.submitState],
            publish: RealTimeEventState[postOrder.publishState],
          },
        ],
      }),
    );
    const postOrderResponseDto = {
      postOrder,
      serverVerification,
    };
    //???????????????????????????????????????????????????
    this.handlePostOrderForTask(
      postOrder,
      serverVerificationPayload,
      postOrderRequestDto.certificateStorageType,
    );
    return postOrderResponseDto;
  }

  async retryPostOrder(userId: number, id: string) {
    let postStateUpdatedPayload;
    this.logger.verbose(`Retry post order userId ${userId} postOrderId ${id}`);
    // ??????publishState=failed???????????????
    const postOrder = await this.postOrdersBaseService.getById(id, {
      relations: ['postMetadata'],
    });
    // ????????????
    if (!postOrder || postOrder.userId !== userId) {
      throw new DataNotFoundException('post order');
    }
    // ????????????????????????
    // ????????????,????????????????????????
    if (PipelineOrderTaskCommonState.FAILED === postOrder.certificateState) {
      postOrder.publishState =
        postOrder.submitState =
        postOrder.certificateState =
          PipelineOrderTaskCommonState.PENDING;

      // ??????????????????
      const { payload } = await this.serverVerificationBaseService.getById(
        postOrder.serverVerificationId,
      );
      // ????????????
      this.handleCertificate(
        postOrder,
        payload,
        postOrder.certificateStorageType,
      ).catch((e) =>
        this.logger.error(
          `Retry post order ${id} certificate error ${e}`,
          PostOrdersLogicService,
        ),
      );
      postStateUpdatedPayload = {
        id: postOrder.id,
        submit: RealTimeEventState.pending,
        publish: RealTimeEventState.pending,
      };
    }
    // ???????????????????????????????????????
    else if (PipelineOrderTaskCommonState.FAILED === postOrder.submitState) {
      postOrder.publishState = postOrder.submitState =
        PipelineOrderTaskCommonState.PENDING;
      postOrder.postTaskId = '';
      postStateUpdatedPayload = {
        id: postOrder.id,
        submit: RealTimeEventState.pending,
        publish: RealTimeEventState.pending,
      };
    }
    // ??????????????????????????????????????????????????????????????????????????????
    else if (PipelineOrderTaskCommonState.FAILED === postOrder.publishState) {
      postOrder.publishState = PipelineOrderTaskCommonState.PENDING;
      //TODO ???????????????????????????????????????postOrder?????????postTask??????publishSiteOrder???
      //????????????????????????postTask????????????????????????????????????postTaskId???????????????????????????????????????????????????????????????????????????????????????????????????
      postOrder.publishSiteOrderId = 0;
      postOrder.publishSiteTaskId = '';
      postStateUpdatedPayload = {
        id: postOrder.id,
        publish: RealTimeEventState.pending,
      };
      const { postTaskId } = postOrder;
      this.logger.verbose(
        `Retry publish site event userId ${userId} postTaskId ${postTaskId}`,
      );
      this.eventEmitter.emit(GENERATE_PUBLISH_SITE_ORDER_EVENT, {
        userId,
        postTaskId,
      } as GeneratePublishSiteOrderEvent);
    }
    // ?????????????????????????????????
    else {
      throw new ConflictException('No retry required');
    }
    const postOrderEntity = await this.postOrdersBaseService.save(postOrder);
    // ???????????????????????????????????????????????????
    this.eventEmitter.emit(
      InternalRealTimeEvent.POST_STATE_UPDATED,
      new InternalRealTimeMessage({
        userId,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: [postStateUpdatedPayload],
      }),
    );
    return postOrderEntity;
  }

  async handlePostOrderForTask(
    postOrder: PostOrderEntity,
    serverVerificationPayload: string,
    certificateStorageType: MetadataStorageType,
  ): Promise<void> {
    //??????,????????????
    const certificatePromise = this.handleCertificate(
      postOrder,
      serverVerificationPayload,
      certificateStorageType,
    ).catch((e) =>
      this.logger.error(
        `Handle post order ${postOrder.id} for task certificate error ${e}`,
        PostOrdersLogicService.name,
      ),
    );
    // TODO ??????????????????????????????????????????????????????????????????????????????
    // ?????????????????????????????????
    this.retryUserFailedPostOrders(postOrder.userId);
  }

  async handleCertificate(
    postOrder: PostOrderEntity,
    serverVerificationPayload: string,
    certificateStorageType?: MetadataStorageType,
  ) {
    if (certificateStorageType) {
      this.logger.verbose(
        `Handle certificate postOrderId ${postOrder.id} certificateStorageType ${certificateStorageType}`,
        this.constructor.name,
      );
      const postOrderId = postOrder.id;
      await this.postOrdersBaseService.update(postOrderId, {
        certificateStorageType,
        certificateState: PipelineOrderTaskCommonState.DOING,
      });
      try {
        await this.doUploadCertificate(
          certificateStorageType,
          postOrder,
          serverVerificationPayload,
          postOrderId,
        );
      } catch (e) {
        this.logger.error(
          `postOrder ${postOrderId} certificate failed: ${e}`,
          PostOrdersLogicService.name,
        );
        // ????????????????????????????????????1???????????????????????????????????????????????????????????????????????????
        try {
          await this.doUploadCertificate(
            certificateStorageType,
            postOrder,
            serverVerificationPayload,
            postOrderId,
          );
        } catch (retryError) {
          this.logger.error(
            `postOrder ${postOrderId} certificate retry failed: ${retryError}`,
            PostOrdersLogicService.name,
          );
          await this.postOrdersBaseService.update(postOrderId, {
            certificateState: PipelineOrderTaskCommonState.FAILED,
            submitState: PipelineOrderTaskCommonState.FAILED,
            publishState: PipelineOrderTaskCommonState.FAILED,
          });
        }
      }
    } else {
      this.logger.verbose(
        `Handle certificate postOrderId ${postOrder.id} empty certificateStorageType`,
        this.constructor.name,
      );
    }
  }

  async doUploadCertificate(
    certificateStorageType: MetadataStorageType,
    postOrder: PostOrderEntity,
    serverVerificationPayload: string,
    postOrderId: string,
  ) {
    const txId = await this.metadataStorageService.upload(
      // MetadataStorageType.ARWEAVE,
      certificateStorageType,
      this.metaSignatureHelper.createPostVerificationKey(
        postOrder?.userId,
        postOrder?.postMetadata?.title,
      ),
      serverVerificationPayload,
    );
    // ?????????????????? arweave???????????????????????????DOING???viewblock??????????????????????????????FINISHED??????????????????????????????????????????????????????data-viewer???
    await this.postOrdersBaseService.update(postOrderId, {
      certificateState: PipelineOrderTaskCommonState.FINISHED,
      certificateId: txId,
    });
  }

  async doingSubmitPost(postTaskId: string) {
    this.logger.verbose(
      `Doing submit post postTaskId ${postTaskId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      { postTaskId },
      {
        submitState: PipelineOrderTaskCommonState.DOING,
      },
    );
  }

  async finishSubmitPost(postTaskId: string, publishSiteOrderId: number) {
    this.logger.verbose(
      `Finish submit post postTaskId ${postTaskId} & link publishSiteOrderId ${publishSiteOrderId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      {
        postTaskId,

        submitState: PipelineOrderTaskCommonState.DOING,
      },
      {
        submitState: PipelineOrderTaskCommonState.FINISHED,
        publishSiteOrderId,
      },
    );
  }
  /**
   * ????????????????????????
   * ????????????????????????post?????????????????????????????????????????????postOrder???????????????????????????
   * @param  postOrderId
   */
  async failSubmitPost(postOrderId: string) {
    this.logger.verbose(
      `Update post submitState&publishState to 'failed' by postOrderId ${postOrderId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.update(
      postOrderId,

      {
        submitState: PipelineOrderTaskCommonState.FAILED,
        publishState: PipelineOrderTaskCommonState.FAILED,
      },
    );
    const postOrderEntity = await this.postOrdersBaseService.getById(
      postOrderId,
    );
    // ???????????????pubishState?????????posts?????????????????????????????????????????????????????????
    const internalRealTimeMessage = new InternalRealTimeMessage({
      userId: postOrderEntity.userId,
      message: InternalRealTimeEvent.POST_STATE_UPDATED,
      data: [
        {
          id: postOrderId,
          submit: RealTimeEventState.failed,
          publish: RealTimeEventState.failed,
        },
      ],
    });
    this.logger.verbose(
      `Emit post internal real time message ${JSON.stringify(
        internalRealTimeMessage,
      )} `,
      this.constructor.name,
    );
    this.eventEmitter.emit(
      InternalRealTimeEvent.POST_STATE_UPDATED,
      internalRealTimeMessage,
    );
  }

  async failSubmitPostByPostTaskId(postTaskId: string) {
    this.logger.verbose(
      `Update post submitState&publishState to 'failed' by postTaskId ${postTaskId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      {
        postTaskId,

        submitState: PipelineOrderTaskCommonState.DOING,
      },
      {
        submitState: PipelineOrderTaskCommonState.FAILED,
        publishState: PipelineOrderTaskCommonState.FAILED,
      },
    );

    // ???????????????pubishState?????????posts?????????????????????????????????????????????????????????
    const postOrderEntities = await this.postOrdersBaseService.find({
      where: { postTaskId },
    });
    if (postOrderEntities?.length > 0) {
      const internalRealTimeMessage = new InternalRealTimeMessage({
        userId: postOrderEntities[0].userId,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: postOrderEntities.map((postOrderEntity) => ({
          id: postOrderEntity.id,
          submit: RealTimeEventState.failed,
          publish: RealTimeEventState.failed,
        })),
      });
      this.logger.verbose(
        `Emit post internal real time message ${JSON.stringify(
          internalRealTimeMessage,
        )} `,
        this.constructor.name,
      );
      this.eventEmitter.emit(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        internalRealTimeMessage,
      );
    }
  }

  async updatePublishOrderId(postTaskId: string, publishSiteOrderId: number) {
    this.logger.verbose(
      `Update post publishSiteOrderId to ${publishSiteOrderId} with postTaskId ${postTaskId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      {
        postTaskId,
      },
      {
        publishSiteOrderId,
      },
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
    //????????????????????????????????????publishSiteTaskId??????????????????????????????????????????????????????????????????publishSiteTaskId????????????????????????????????????????????????????????????????????????state
    await this.postOrdersBaseService.batchUpdate(
      {
        publishSiteOrderId: In(publishSiteOrderIds),
        publishState: In([
          PipelineOrderTaskCommonState.PENDING,
          PipelineOrderTaskCommonState.FAILED,
        ]),
        // publishSiteTaskId: '',
      },
      { publishSiteTaskId },
    );
  }
  async doingPublishPost(publishSiteTaskId: string) {
    this.logger.verbose(
      `Doing publish post publishSiteTaskId ${publishSiteTaskId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      { publishSiteTaskId },
      {
        publishState: PipelineOrderTaskCommonState.DOING,
      },
    );
  }

  async finishPublishPost(userId: number, publishSiteTaskId: string) {
    this.logger.verbose(
      `Finish publish post publishSiteTaskId ${publishSiteTaskId} `,
      this.constructor.name,
    );
    await this.postOrdersBaseService.batchUpdate(
      { publishSiteTaskId },
      {
        publishState: PipelineOrderTaskCommonState.FINISHED,
      },
    );
    const finishPublishPostOrderEntities =
      await this.postOrdersBaseService.find({
        where: { publishSiteTaskId },
      });
    if (finishPublishPostOrderEntities?.length > 0) {
      const internalRealTimeMessage = new InternalRealTimeMessage({
        userId,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: finishPublishPostOrderEntities.map((postOrderEntity) => ({
          id: postOrderEntity.id,
          publish: RealTimeEventState.finished,
        })),
      });
      this.logger.verbose(
        `Finish publish ${
          finishPublishPostOrderEntities.length
        } post(s) internal real time message ${JSON.stringify(
          internalRealTimeMessage,
        )} `,
        this.constructor.name,
      );
      // ?????????????????????pubishState?????????posts?????????????????????????????????????????????????????????
      this.eventEmitter.emit(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        internalRealTimeMessage,
      );
    } else {
      this.logger.verbose(
        `Finish publish post without relative order`,
        this.constructor.name,
      );
    }
  }

  async failPublishPost(userId: number, publishSiteTaskId: string) {
    await this.postOrdersBaseService.batchUpdate(
      { publishSiteTaskId },
      {
        publishState: PipelineOrderTaskCommonState.FAILED,
      },
    );
    const failedPublishPostOrderEntities =
      await this.postOrdersBaseService.find({
        where: { publishSiteTaskId },
      });
    if (failedPublishPostOrderEntities?.length > 0) {
      const internalRealTimeMessage = new InternalRealTimeMessage({
        userId,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: failedPublishPostOrderEntities.map((postOrderEntity) => ({
          id: postOrderEntity.id,
          publish: RealTimeEventState.failed,
        })),
      });
      this.logger.verbose(
        `Emit post internal real time message ${JSON.stringify(
          internalRealTimeMessage,
        )} `,
        this.constructor.name,
      );
      // ?????????????????????pubishState?????????posts?????????????????????????????????????????????????????????
      this.eventEmitter.emit(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        internalRealTimeMessage,
      );
    } else {
      this.logger.verbose(
        `No relative post order, no internal real time message.`,
        this.constructor.name,
      );
    }
  }
}
