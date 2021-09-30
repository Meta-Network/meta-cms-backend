import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { FindManyOptions } from 'typeorm';

export function isFindManyOptions<T = unknown>(
  obj: unknown,
): obj is FindManyOptions<T> {
  if ((obj as FindManyOptions<T>).where) return true;
  return false;
}

export function isPaginationOptions(obj: unknown): obj is IPaginationOptions {
  if ((obj as IPaginationOptions).page) return true;
  return false;
}
