import { LoggerService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GiteeService } from '../../../src/api/provider/giteeService';
import { CreateGitRepoResult } from '../../../src/types';

describe('GiteeService （e2e)', () => {
  const giteeToken = process.env.GITEE_TOKEN;
  const giteeUsername = process.env.GITEE_USERNAME;

  let service: GiteeService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: {
            verbose: jest.fn(),
          },
        },
        GiteeService,
      ],
    }).compile();

    service = module.get<GiteeService>(GiteeService);
    logger = module.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(logger).toBeDefined();
  });

  it('should be a created repo', async () => {
    const data = await service.createGitRepo(
      giteeToken,
      giteeUsername,
      'test-repo',
    );
    expect(data).toMatchObject<CreateGitRepoResult>({
      status: true,
      empty: false,
      permissions: {
        admin: true,
        pull: true,
        push: true,
      },
    });
  });

  it('should be a empty repo', async () => {
    const data = await service.createGitRepo(
      giteeToken,
      giteeUsername,
      'a-new-private-repo',
      true,
    );
    expect(data).toMatchObject<CreateGitRepoResult>({
      status: true,
      empty: true,
      permissions: {
        admin: true,
        pull: true,
        push: true,
      },
    });
  });
});
