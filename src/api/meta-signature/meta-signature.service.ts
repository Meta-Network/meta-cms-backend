import {
  authorPostDigest,
  AuthorPostDigestMetadata,
  authorPostDigestSign,
  AuthorPostSignatureMetadata,
  authorPublishMetaSpaceRequest,
  authorPublishMetaSpaceServerVerificationSign,
  BaseSignatureMetadata,
  serverVerificationSign,
  serverVerificationSignWithContent,
} from '@metaio/meta-signature-util';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { ValidationException } from '../../exceptions';
import { MetadataStorageType } from '../../types/enum';
import { MetadataStorageService } from '../provider/metadata-storage/metadata-storage.service';

@Injectable()
export class MetaSignatureService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly metadataStorageService: MetadataStorageService,
  ) {}

  async validateAuthorDigestRequestMetadata(
    authorDigestRequestMetadataStorageType: MetadataStorageType,
    authorDigestRequestMetadataRefer: string,
  ): Promise<AuthorPostDigestMetadata> {
    let authorDigestRequestMetadata: AuthorPostDigestMetadata;

    this.logger.debug(
      `Get ${authorDigestRequestMetadataStorageType} ${authorDigestRequestMetadataRefer}`,
      this.constructor.name,
    );
    const authorDigestRequestMetadataText =
      await this.metadataStorageService.get(
        authorDigestRequestMetadataStorageType,
        authorDigestRequestMetadataRefer,
      );
    if (!authorDigestRequestMetadataText) {
      throw new ValidationException(
        'AuthorDigestRequestMetadata must not be empty',
      );
    }

    try {
      authorDigestRequestMetadata = JSON.parse(
        authorDigestRequestMetadataText,
      ) as AuthorPostDigestMetadata;
    } catch (err) {
      throw new ValidationException(
        `Invalid digest: ${authorDigestRequestMetadata}`,
      );
    }
    this.logger.debug(
      `Verify digest: ${authorDigestRequestMetadataText}`,
      this.constructor.name,
    );
    if (!authorPostDigest.verify(authorDigestRequestMetadata)) {
      throw new ValidationException(
        `Invalid digest: ${authorDigestRequestMetadataText}`,
      );
    }
    return authorDigestRequestMetadata;
  }

  async validateAuthorDigestSignatureMetadata(
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
  ): Promise<AuthorPostSignatureMetadata> {
    let authorDigestSignatureMetadata: AuthorPostSignatureMetadata;

    this.logger.debug(
      `Get ${authorDigestSignatureMetadataStorageType} ${authorDigestSignatureMetadataRefer}`,
      this.constructor.name,
    );
    const authorDigestSignatureMetadataText =
      await this.metadataStorageService.get(
        authorDigestSignatureMetadataStorageType,
        authorDigestSignatureMetadataRefer,
      );
    if (!authorDigestSignatureMetadataText) {
      throw new ValidationException(
        'AuthorDigestSignatureMetadata must not be empty',
      );
    }

    try {
      authorDigestSignatureMetadata = JSON.parse(
        authorDigestSignatureMetadataText,
      ) as AuthorPostSignatureMetadata;
    } catch (err) {
      throw new ValidationException(
        `Invalid authorDigestSignatureMetadata: ${authorDigestSignatureMetadataText}`,
      );
    }
    this.logger.debug(
      `Verify signature: ${authorDigestSignatureMetadataText}`,
      this.constructor.name,
    );
    if (!authorPostDigestSign.verify(authorDigestSignatureMetadata)) {
      throw new ValidationException(
        `Invalid authorDigestSignatureMetadata: ${authorDigestSignatureMetadataText}`,
      );
    }
    return authorDigestSignatureMetadata;
  }

  async generateAuthorDigestSignWithContentServerVerificationMetadata(
    authorDigestRequestMetadataStorageType: MetadataStorageType,
    authorDigestRequestMetadataRefer: string,
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
  ): Promise<{
    authorDigestRequestMetadata: AuthorPostDigestMetadata;
    authorDigestSignatureMetadata: AuthorPostSignatureMetadata;
    authorDigestSignWithContentServerVerificationMetadata: BaseSignatureMetadata;
  }> {
    const authorDigestRequestMetadata =
      await this.validateAuthorDigestRequestMetadata(
        authorDigestRequestMetadataStorageType,
        authorDigestRequestMetadataRefer,
      );
    const authorDigestSignatureMetadata =
      await this.validateAuthorDigestSignatureMetadata(
        authorDigestSignatureMetadataStorageType,
        authorDigestSignatureMetadataRefer,
      );
    const authorDigestSignServerVerificationMetadata =
      serverVerificationSign.generate(
        this.configService.get('metaSignature.serverKeys'),
        this.configService.get('metaSignature.serverDomain'),
        authorDigestSignatureMetadata,
        authorDigestSignatureMetadataRefer,
      );
    const authorDigestSignWithContentServerVerificationMetadata =
      serverVerificationSignWithContent.generate(
        authorDigestRequestMetadata,
        authorDigestRequestMetadataRefer,
        authorDigestSignServerVerificationMetadata,
      );
    return {
      authorDigestRequestMetadata,
      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadata,
    };
  }

  async generateAndUploadAuthorDigestSignWithContentServerVerificationMetadata(
    verificationKey: string,
    authorDigestRequestMetadataStorageType: MetadataStorageType,
    authorDigestRequestMetadataRefer: string,
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
  ): Promise<{
    authorDigestSignWithContentServerVerificationMetadataRefer: string;
    authorDigestSignWithContentServerVerificationMetadata: BaseSignatureMetadata;
    authorDigestRequestMetadata: AuthorPostDigestMetadata;
    authorDigestSignatureMetadata: AuthorPostSignatureMetadata;
  }> {
    if (
      !authorDigestRequestMetadataRefer &&
      !authorDigestSignatureMetadataRefer
    ) {
      // author didn't sign. skip
      return {
        authorDigestSignWithContentServerVerificationMetadataRefer: '',
        authorDigestSignWithContentServerVerificationMetadata: null,
        authorDigestRequestMetadata: null,
        authorDigestSignatureMetadata: null,
      };
    }

    if (
      authorDigestRequestMetadataRefer &&
      !authorDigestSignatureMetadataRefer
    ) {
      throw new ValidationException(
        'AuthorDigestRequestMetadataRefer must not be empty',
      );
    }
    if (
      !authorDigestRequestMetadataRefer &&
      authorDigestSignatureMetadataRefer
    ) {
      throw new ValidationException(
        'AuthorDigestSignatureMetadataRefer must not be empty',
      );
    }
    if (!authorDigestRequestMetadataStorageType) {
      throw new ValidationException(
        'AuthorDigestRequestMetadataStorageType must not be empty',
      );
    }

    if (!authorDigestSignatureMetadataStorageType) {
      throw new ValidationException(
        'AuthorDigestSignatureMetadataStorageType must not be empty',
      );
    }
    const {
      authorDigestRequestMetadata,
      authorDigestSignatureMetadata,
      authorDigestSignWithContentServerVerificationMetadata,
    } = await this.generateAuthorDigestSignWithContentServerVerificationMetadata(
      authorDigestRequestMetadataStorageType,
      authorDigestRequestMetadataRefer,
      authorDigestSignatureMetadataStorageType,
      authorDigestSignatureMetadataRefer,
    );

    const authorDigestSignWithContentServerVerificationMetadataRefer =
      await this.metadataStorageService.upload(
        authorDigestSignatureMetadataStorageType,
        `authorDigestSignWithContentServerVerification/${verificationKey}`,
        JSON.stringify(authorDigestSignWithContentServerVerificationMetadata),
      );
    return {
      authorDigestSignWithContentServerVerificationMetadataRefer,
      authorDigestSignWithContentServerVerificationMetadata,
      authorDigestRequestMetadata,
      authorDigestSignatureMetadata,
    };
  }

  async validateAuthorPublishMetaSpaceRequestMetadata(
    authorPublishMetaSpaceRequestMetadataStorageType: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer: string,
  ): Promise<AuthorPostSignatureMetadata> {
    let authorPublishMetaSpaceRequestMetadata: AuthorPostSignatureMetadata;

    this.logger.debug(
      `Get ${authorPublishMetaSpaceRequestMetadataStorageType} ${authorPublishMetaSpaceRequestMetadataRefer}`,
      this.constructor.name,
    );
    const authorPublishMetaSppaceRequestMetadataText =
      await this.metadataStorageService.get(
        authorPublishMetaSpaceRequestMetadataStorageType,
        authorPublishMetaSpaceRequestMetadataRefer,
      );
    if (!authorPublishMetaSppaceRequestMetadataText) {
      throw new ValidationException(
        'AuthorPublishMetaSpaceRequestMetadata must not be empty',
      );
    }

    try {
      authorPublishMetaSpaceRequestMetadata = JSON.parse(
        authorPublishMetaSppaceRequestMetadataText,
      ) as AuthorPostSignatureMetadata;
    } catch (err) {
      throw new ValidationException(
        `Invalid authorPublishMetaSpaceRequestMetadata: ${authorPublishMetaSppaceRequestMetadataText}`,
      );
    }
    this.logger.debug(
      `Verify authorPublishMetaSpaceRequestMetadata: ${authorPublishMetaSppaceRequestMetadataText}`,
      this.constructor.name,
    );
    if (
      !authorPublishMetaSpaceRequest.verify(
        authorPublishMetaSpaceRequestMetadata,
      )
    ) {
      throw new ValidationException(
        `Invalid authorPublishMetaSpaceRequestMetadata: ${authorPublishMetaSppaceRequestMetadataText}`,
      );
    }
    return authorPublishMetaSpaceRequestMetadata;
  }

  async generatePublishMetaSpaceServerVerificationMetadata(
    authorPublishMetaSpaceRequestMetadataStorageType: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer: string,
  ): Promise<{
    authorPublishMetaSpaceRequestMetadata: AuthorPostSignatureMetadata;
    authorPublishMetaSpaceServerVerificationMetadata: BaseSignatureMetadata;
  }> {
    const authorPublishMetaSpaceRequestMetadata =
      await this.validateAuthorPublishMetaSpaceRequestMetadata(
        authorPublishMetaSpaceRequestMetadataStorageType,
        authorPublishMetaSpaceRequestMetadataRefer,
      );

    const authorPublishMetaSpaceServerVerificationMetadata =
      authorPublishMetaSpaceServerVerificationSign.generate(
        this.configService.get('metaSignature.serverKeys'),
        this.configService.get('metaSignature.serverDomain'),
        authorPublishMetaSpaceRequestMetadata,
        authorPublishMetaSpaceRequestMetadataRefer,
      );

    return {
      authorPublishMetaSpaceRequestMetadata,
      authorPublishMetaSpaceServerVerificationMetadata,
    };
  }

  async generateAndUploadPublishMetaSpaceServerVerificationMetadata(
    verificationKey: string,
    authorPublishMetaSpaceRequestMetadataStorageType: MetadataStorageType,
    authorPublishMetaSpaceRequestMetadataRefer: string,
  ): Promise<{
    authorPublishMetaSpaceServerVerificationMetadataRefer: string;
    authorPublishMetaSpaceServerVerificationMetadata: BaseSignatureMetadata;
    authorPublishMetaSpaceRequestMetadata: AuthorPostSignatureMetadata;
  }> {
    if (
      !authorPublishMetaSpaceRequestMetadataStorageType &&
      !authorPublishMetaSpaceRequestMetadataRefer
    ) {
      // author didn't sign. skip
      return {
        authorPublishMetaSpaceServerVerificationMetadataRefer: '',
        authorPublishMetaSpaceServerVerificationMetadata: null,
        authorPublishMetaSpaceRequestMetadata: null,
      };
    }
    if (!authorPublishMetaSpaceRequestMetadataStorageType) {
      throw new ValidationException(
        'AuthorPublishMetaSpaceRequestMetadataStorageType must not be empty',
      );
    }
    if (!authorPublishMetaSpaceRequestMetadataRefer) {
      throw new ValidationException(
        'AuthorPublishMetaSpaceRequestMetadataRefer must not be empty',
      );
    }
    const {
      authorPublishMetaSpaceRequestMetadata,
      authorPublishMetaSpaceServerVerificationMetadata,
    } = await this.generatePublishMetaSpaceServerVerificationMetadata(
      authorPublishMetaSpaceRequestMetadataStorageType,
      authorPublishMetaSpaceRequestMetadataRefer,
    );

    const authorPublishMetaSpaceServerVerificationMetadataRefer =
      await this.metadataStorageService.upload(
        authorPublishMetaSpaceRequestMetadataStorageType,
        `authorPublishMetaSpaceServerVerificationMetadata/${verificationKey}`,
        JSON.stringify(authorPublishMetaSpaceServerVerificationMetadata),
      );
    return {
      authorPublishMetaSpaceServerVerificationMetadataRefer,
      authorPublishMetaSpaceServerVerificationMetadata,
      authorPublishMetaSpaceRequestMetadata,
    };
  }
}
