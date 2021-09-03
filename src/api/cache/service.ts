import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { Cache, CachingConfig } from 'cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AppCacheService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    this.logger.verbose(`Get cache key ${key}`, AppCacheService.name);
    try {
      return await this.cacheManager.get(key);
    } catch (err) {
      this.logger.error(
        `Get cache key ${key} error:`,
        err,
        AppCacheService.name,
      );
    }
  }

  async set<T>(key: string, value: T, options?: CachingConfig): Promise<T>;
  async set<T>(key: string, value: T, ttl: number): Promise<T>;
  async set<T>(
    key: string,
    value: T,
    arg?: CachingConfig | number,
  ): Promise<T> {
    this.logger.verbose(`Set cache key ${key}`, AppCacheService.name);
    try {
      if (typeof arg === 'number') {
        return await this.cacheManager.set(key, value, arg);
      }
      return await this.cacheManager.set(key, value, arg);
    } catch (err) {
      this.logger.error(
        `Set cache key ${key} error:`,
        err,
        AppCacheService.name,
      );
    }
  }

  async del(key: string): Promise<void> {
    this.logger.verbose(`Delete cache key ${key}`, AppCacheService.name);
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.error(
        `Delete cache key ${key} error:`,
        err,
        AppCacheService.name,
      );
    }
  }

  async reset(): Promise<void> {
    this.logger.verbose(`Cache reset`, AppCacheService.name);
    await this.cacheManager.reset();
  }
}
