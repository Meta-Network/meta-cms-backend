import {
  generateAuthorDigestSignServerVerificationMetadata,
  generateAuthorDigestSignWithContentServerVerificationMetadata,
  verifyAuthorDigestMetadataSignature,
  verifyDigest,
} from '@metaio/meta-signature-util';
import {
  AuthorDigestRequestMetadata,
  AuthorSignatureMetadata,
  SignatureMetadata,
} from '@metaio/meta-signature-util/type/types';
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
  ): Promise<AuthorDigestRequestMetadata> {
    let authorDigestRequestMetadata: AuthorDigestRequestMetadata;

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
        'AuthorDigestSignatureMetadata must not be empty',
      );
    }

    try {
      authorDigestRequestMetadata = JSON.parse(
        authorDigestRequestMetadataText,
      ) as AuthorDigestRequestMetadata;
    } catch (err) {
      throw new ValidationException(
        `Invalid digest: ${authorDigestRequestMetadata}`,
      );
    }
    this.logger.debug(
      `Verify digest: ${authorDigestRequestMetadataText}`,
      this.constructor.name,
    );
    if (!verifyDigest(authorDigestRequestMetadata)) {
      throw new ValidationException(
        `Invalid digest: ${authorDigestRequestMetadataText}`,
      );
    }
    return authorDigestRequestMetadata;
  }

  async validateAuthorDigestSignatureMetadata(
    authorDigestSignatureMetadataStorageType: MetadataStorageType,
    authorDigestSignatureMetadataRefer: string,
  ): Promise<AuthorSignatureMetadata> {
    let authorDigestSignatureMetadata: AuthorSignatureMetadata;

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
      ) as AuthorSignatureMetadata;
    } catch (err) {
      throw new ValidationException(
        `Invalid authorDigestSignatureMetadata: ${authorDigestSignatureMetadataText}`,
      );
    }
    this.logger.debug(
      `Verify signature: ${authorDigestSignatureMetadataText}`,
      this.constructor.name,
    );
    if (!verifyAuthorDigestMetadataSignature(authorDigestSignatureMetadata)) {
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
    authorDigestRequestMetadata: AuthorDigestRequestMetadata;
    authorDigestSignatureMetadata: AuthorSignatureMetadata;
    authorDigestSignWithContentServerVerificationMetadata: SignatureMetadata;
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
      generateAuthorDigestSignServerVerificationMetadata(
        this.configService.get('metaSignature.serverKeys'),
        this.configService.get('metaSignature.serverDomain'),
        authorDigestSignatureMetadata,
        authorDigestSignatureMetadataRefer,
      );
    const authorDigestSignWithContentServerVerificationMetadata =
      generateAuthorDigestSignWithContentServerVerificationMetadata(
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
    authorDigestSignWithContentServerVerificationMetadata: SignatureMetadata;
    authorDigestRequestMetadata: AuthorDigestRequestMetadata;
    authorDigestSignatureMetadata: AuthorSignatureMetadata;
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
}