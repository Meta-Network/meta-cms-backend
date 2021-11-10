import { Test, TestingModule } from '@nestjs/testing';

import { PostHelper } from './post.helper';

describe('PostHelper', () => {
  let postHelper: PostHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostHelper],
    }).compile();

    postHelper = module.get<PostHelper>(PostHelper);
  });

  it('should be defined', () => {
    expect(postHelper).toBeDefined();
  });

  describe('createVerificationKey', () => {
    it('root', async () => {
      const userId = 111;
      const title = '测试标题';
      console.log(postHelper.createPostVerificationKey(userId, title));
    });
  });
});
