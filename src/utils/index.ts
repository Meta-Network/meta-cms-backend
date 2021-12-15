import { isISO8601 } from 'class-validator';

export function iso8601ToDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' && isISO8601(date)) {
    return new Date(date);
  }
  return new Date(Date.now());
}

export function decodeData(
  encoding: string,
  data: string,
): { encoding: 'utf-8'; content: string } {
  if (encoding === 'base64') {
    const buff = Buffer.from(data, 'base64');
    const decode = buff.toString('utf-8');
    return {
      encoding: 'utf-8',
      content: decode,
    };
  }
  throw new Error(`Unknown encoding type ${encoding}`);
}
