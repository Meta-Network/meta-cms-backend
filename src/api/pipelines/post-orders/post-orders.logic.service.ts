import {
  authorPostDigest,
  authorPostDigestSign,
  serverVerificationSign,
  serverVerificationSignWithContent,
} from '@metaio/meta-signature-util-v2';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IPaginationMeta, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { In } from 'typeorm';

import { PostMetadataEntity } from '../../../entities/pipeline/post-metadata.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
import {
  PostOrderRequestDto,
  PostOrderResponseDto,
} from '../dto/post-order.dto';
import { PostOrdersBaseService } from './post-orders.base.service';

@Injectable()
export class PostOrdersLogicService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly postOrdersBaseService: PostOrdersBaseService,
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

  async pagiUserPublishingPostOrders(
    userId: number,
    options: IPaginationOptions<IPaginationMeta>,
  ) {
    return await this.postOrdersBaseService.pagi(options, {
      where: {
        userId,
        publishState: In([
          PipelineOrderTaskCommonState.NONE,
          PipelineOrderTaskCommonState.PENDING,
          PipelineOrderTaskCommonState.DOING,
          PipelineOrderTaskCommonState.FAILED,
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

  async savePostOrder(
    userId: number,
    postOrderRequestDto: PostOrderRequestDto,
  ): Promise<PostOrderResponseDto> {
    const digest = postOrderRequestDto.authorPostDigest;
    const sign = postOrderRequestDto.authorPostSign;
    if (!authorPostDigestSign.verify(sign)) {
      throw new BadRequestException('Invalid author post digest signature');
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
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PostMetadataEntity;
    const createdPostOrder = this.postOrdersBaseService.create({
      id: sign.signature,
      userId,
      postMetadata,
      serverVerificationId: serverVerification.signature,
    });
    const postOrder = await this.postOrdersBaseService.save(createdPostOrder);
    return {
      postOrder,
      serverVerification,
    };
  }

  async retryPostOrder(userId: number, id: string) {
    return;
  }
}
