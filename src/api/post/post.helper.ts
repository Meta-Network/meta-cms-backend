import han from 'han';
import moment from 'moment';

export class PostHelper {
  createPostVerificationKey(userId: number, title: string): string {
    return `${userId}/${moment().format('YYYYMMDDHHmmss')}/${han.letter(
      title,
      '-',
    )}`;
  }
}
