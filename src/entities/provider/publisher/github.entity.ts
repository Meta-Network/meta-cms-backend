import { IsBoolean, IsOptional } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { GitPublisherProviderEntity } from './git.entity';

@Entity()
export class GitHubPublisherProviderEntity extends GitPublisherProviderEntity {
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
