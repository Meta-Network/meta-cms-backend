import { IsBoolean, IsOptional } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { GitStorageProviderEntity } from './git.entity';

@Entity()
export class GiteeStorageProviderEntity extends GitStorageProviderEntity {
  /**
   * Use git provider
   * @default true
   * @example true
   */
  @Column({ comment: 'Use git provider', type: 'bool', default: true })
  @IsBoolean()
  @IsOptional()
  useGitProvider?: boolean = true;
}
