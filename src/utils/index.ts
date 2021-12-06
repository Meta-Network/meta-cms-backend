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
