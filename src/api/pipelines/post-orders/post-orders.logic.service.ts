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

  async pagiUserAllPostOrders(
    userId: number,
    options: IPaginationOptions<IPaginationMeta>,
  ) {
    return await this.postOrdersBaseService.pagi(options, {
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['postMetadata'],
    });
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
    return await this.postOrdersBaseService.pagi(options, {
      where: {
        userId,
        publishState: In([
          PipelineOrderTaskCommonState.PENDING,
          PipelineOrderTaskCommonState.DOING,
        ]),
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['postMetadata'],
    });
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
  ): Promise<PostOrderResponseDto> {
    const digest = postOrderRequestDto.authorPostDigest;
    const sign = postOrderRequestDto.authorPostSign;
    if (!authorPostDigestSign.verify(sign)) {
      throw new BadRequestException('Invalid author post sign');
    }
    if (!authorPostDigest.verify(digest)) {
      throw new BadRequestException('Invalid author post digest');
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
    // 如果无法生成保存postOrder，那就是失败了，只要能保存，都还有办法重试
    const createdPostOrder = this.postOrdersBaseService.create({
      id: sign.signature,
      userId,
      postMetadata,
      serverVerificationId: serverVerification.signature,
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
            submit: RealTimeEventState.pending,
            publish: RealTimeEventState.pending,
          },
        ],
      }),
    );
    const postOrderResponseDto = {
      postOrder,
      serverVerification,
    };
    //这一部分是后台异步处理，不需要等待
    this.handlePostOrderForTask(
      postOrder,
      serverVerificationPayload,
      postOrderRequestDto.certificateStorageType,
    );
    return postOrderResponseDto;
  }

  async retryPostOrder(userId: number, id: string) {
    let postStateUpdatedPayload;
    // 只有publishState=failed才可以重试
    const postOrder = await this.postOrdersBaseService.getById(id, {
      relations: ['postMetadata'],
    });
    // 权限校验
    if (!postOrder || postOrder.userId !== userId) {
      throw new DataNotFoundException('post order');
    }
    // 区分失败在哪一步
    // 存证失败,需要重新处理存证
    if (PipelineOrderTaskCommonState.FAILED === postOrder.certificateState) {
      postOrder.publishState =
        postOrder.submitState =
        postOrder.certificateState =
          PipelineOrderTaskCommonState.PENDING;

      // 立即发起一个
      const { payload } = await this.serverVerificationBaseService.getById(
        postOrder.serverVerificationId,
      );
      // 异步处理
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
    // 提交失败，需要重新处理提交
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
    // 发布失败，需要重新处理发布。相当于从提交成功重新开始
    else if (PipelineOrderTaskCommonState.FAILED === postOrder.publishState) {
      postOrder.publishState = PipelineOrderTaskCommonState.PENDING;
      //TODO 发出事件，通知基于此postOrder对应的postTask创建publishSiteOrder
      postOrder.publishSiteOrderId = 0;
      postOrder.publishSiteTaskId = '';
      postStateUpdatedPayload = {
        id: postOrder.id,
        publish: RealTimeEventState.pending,
      };
    }
    // 没有失败状态，不用重试
    else {
      throw new ConflictException('No retry required');
    }
    const postOrderEntity = await this.postOrdersBaseService.save(postOrder);
    // 重试也会导致状态变化，需要发送事件
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
    //存证,异步处理
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
    // TODO 替换链接？建议在前端完成，否则请求和生成的链接对不上
    // 之前失败的文章跟随重试
    this.retryUserFailedPostOrders(postOrder.userId);
  }

  async handleCertificate(
    postOrder: PostOrderEntity,
    serverVerificationPayload: string,
    certificateStorageType?: MetadataStorageType,
  ) {
    if (certificateStorageType) {
      const postOrderId = postOrder.id;
      await this.postOrdersBaseService.update(postOrderId, {
        certificateStorageType,
        certificateState: PipelineOrderTaskCommonState.PENDING,
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
        // 存证失败最多立即额外尝试1次（必须），下次触发为手动或是跟随新文章一起重试。
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
          });
        }
      }
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
    // TODO 跟进 arweave打包进度，这里标记为DOING，viewblock确认打包成功再标记为FINISHED
    await this.postOrdersBaseService.update(postOrderId, {
      certificateState: PipelineOrderTaskCommonState.DOING,
      certificateId: txId,
    });
  }
}
