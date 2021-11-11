import { Injectable } from '@nestjs/common';
import han from 'han';
import moment from 'moment';

@Injectable()
export class MetaSignatureHelper {
  createPostVerificationKey(userId: number, title: string): string {
    return `${userId}/${moment().format('YYYYMMDDHHmmss')}/${han.letter(
      title,
      '-',
    )}`;
  }
  createPublishMetaSpaceVerificationKey(
    userId: number,
    siteConfigId: number,
  ): string {
    return `${userId}/${siteConfigId}/${moment().format('YYYYMMDDHHmmss')}`;
  }
}
