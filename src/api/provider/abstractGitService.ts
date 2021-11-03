import { CreateGitRepoResult } from '../../types';

export abstract class AbstractGitService {
  public abstract createGitRepo(
    token: string,
    userName: string,
    repoName: string,
    privateRepo?: boolean,
  ): Promise<CreateGitRepoResult>;
}
