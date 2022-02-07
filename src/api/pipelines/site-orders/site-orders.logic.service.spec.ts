import {
  authorPostDigest,
  authorPostDigestSign,
  KeyPair,
} from '@metaio/meta-signature-util-v2';
import { LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import yaml from 'js-yaml';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';

import { WinstonConfigService } from '../../../configs/winston';
import { SiteConfigEntity } from '../../../entities/siteConfig.entity';
import { PipelineOrderTaskCommonState } from '../../../types/enum';
import { SiteConfigLogicService } from '../../site/config/logicService';
import { DeploySiteOrderRequestDto } from '../dto/site-order.dto';
import { PostOrdersLogicService } from '../post-orders/post-orders.logic.service';
import { ServerVerificationBaseService } from '../server-verification/server-verification.base.service';
import { DeploySiteOrdersBaseService } from './deploy-site-orders.base.service';
import { PublishSiteOrdersBaseService } from './publlish-site-orders.base.service';
import { SiteOrdersLogicService } from './site-orders.logic.service';

describe('SiteOrdersLogicService', () => {
  let logger: LoggerService;
  let configService: ConfigService;
  let deploySiteOrdersBaseService;
  //  = new DeploySiteOrdersBaseService(
  //   logger,
  //   undefined,
  // );
  let publishSiteOrdersBaseService;
  //  = new PublishSiteOrdersBaseService(
  //   logger,
  //   undefined,
  // );
  let siteConfigLogicService;
  let postOrdersLogicService;
  //  = new PostOrdersLogicService(
  //   logger,
  //   configService,
  //   undefined,
  //   undefined,
  //   undefined,
  //   undefined,
  //   undefined,
  // );
  let serverVerificationBaseService;
  //  = new ServerVerificationBaseService(
  //   logger,
  //   undefined,
  // );
  let service: SiteOrdersLogicService;

  const authorKeys = {
    private:
      '0x90b2110acb0a981f4b6748fd67372c11daaa5f8c2cb8db42beadfd5bfb3b3a4c',
    public:
      '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
  } as KeyPair;
  const serverKeys = {
    private:
      '0x20db0762690fa66a1534de672822c65c71b9be027b2962e3560cb0238d89a073',
    public:
      '0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f',
  };
  const serverDomain = 'meta-cms.mttk.net';
  const defaultPost = {
    title: 'Welcome aboard Meta Space （CN+EN）',
    categories: 'Generated',
    tags: 'Meta Space',
    cover: '',
    license: '',
    summary: '',
    content: `
![](https://i.imgur.com/U9HusFg.png)

Hello Captain！
你好舰长！

欢迎登入 Meta Space！ 
Meta Team 希望打造的 Meta Space 是一个可持续构建的虚拟数字身份，您的元数据展示空间。

Web2.0 的时代摇摇欲坠——自1999年 Darcy DiNucci 提出这个术语之后，诸如版权保护、隐私控制、数据确权、身份连续性、数据控制权、信息审查等问题，一直存在并越来越让人担忧，这些阻碍创作者们二十余年的痛点将会在接下来的 Web3.0 时代中被更好的解决。人类将会通过 元数据宇宙和社交通证 史无前例地在未来连接为一个整体。在通向 Web3.0 的路上 ，还有无数个和您一样的同行者，以及未来更多受到启迪而加入到 Web3 舰队的创作者们。

## 什么是 Meta Space

与人们当下已经习惯的社交网络不同，Meta Space 是完全属于您个人的空间。您的创作将存储在由您指定的可控空间，发布到完全属于您自己的域名，并且创作提交和发布的整个流程，都由可校验元数据的存证。Meta Space 从编辑到发布全流程保护您的数字权益。换句话说，您自己就是平台，所有的流量、收益以及数据版权都由您自己控制。如果你愿意，您过往的创作也将在不久的将来通过我们和社区发明的各种各样的迁移工具，安全地回归到您的 Meta Space 中。而社交网络将会在未来通过 Meta Team 提供的社交通证工具来逐步实现。Meta Space 是载您驶向 Web3.0 元数据宇宙的星际战舰。


对于看到这里的读者：
如果你希望自己创作的珍贵内容可被永久存储；
如果你希望自己创作到发布的过程不会被平台作恶；
如果你希望可以获得一个完全属于自己掌控的展示空间；
如果你希望从现在开始做好进入 Web3.0 世界的准备；
欢迎你来到这里创建自己的 Meta Space！
如果你是 Matataki 的老用户，这里将会是你们的新乐土！

## 为什么是 Meta Space

Meta Space 是可以脱离平台存在的独立站点，是个人创作元数据的展示空间，也是您进入 Web3.0 必备的、可持续构建的数字身份。

我们将过往产品 Matataki 中大家最喜爱的部分保留并且全面加强，同时提供了去平台化的体验。以下特性仅仅是一小部分：

**去平台化体验**
Meta Space 只作为工具，平台由您创建和控制。

**Markdown**
知道你钟爱 Markdown 写作，我们也是。

**去中心化存储**
被删帖删怕了吧？试试去中心化存储？

**创作存证**
每个环节我们都提供了可追溯可校验的存证工具！

**安全创作**
所有创作都在您本地完成，我们——任何您以外的其他人，都无权插手。

**元数据**
所有的内容、素材都以去中心化存储的元数据作为基础，保留 NFT 创作空间。

**社交通证**
上代产品 Matataki 中的核心价值工具——  Fan票，将在未来强势回归 Meta Space 中。

**更多特性，面向未来**
我们曾设想过这样一个未来世界：
- 我希望在互联网上可以获得一个自己可控制的且永久的身份；
- 我希望我进入任何社交媒体的时候，都没有好友关系转移的负担；
- 我希望哪怕只和1000个真正的粉丝去达成连接，而不是关注虚荣指标——流量；
- 我希望我只去做自己喜欢且擅长的事情，就可以获得收入，养活自己；
- 我希望可以自由把控自己的生活方式，而不再被所谓的成功观念所绑架。
- 我所希望的 Web3.0 形式，是个人将元数据和数据掌握在自己手中。
- 我所希望的 Web3.0 形式，是平台负责好形式，个人负责好内容，网络负责好社交。


我们的产品面向未来做足了准备，热切地朝向“创作者经济”出发——更多特性将会在未来逐步上线，欢迎随时联系我们，告诉我们你的想法！

## 关于 Meta Space 的链接

Meta WIKI：https://meta-io.gitbook.io/meta-wiki

Join Matrix Group ：https://matrix.to/#/!jrjmzTFiYYIuKnRpEg:matrix.org?via=matrix.org
Join Discord ：https://discord.com/invite/59cXXWCWUT
Join Telegram：https://t.me/metanetwork
Twitter：https://twitter.com/realMetaNetwork
Medium：https://medium.com/meta-network
Youtube：https://www.youtube.com/channel/UC-rNon6FUm3blTnSrXta2gw


Meta.io 官网（https://meta.io/）
Meta Network 可视化社交网络 （https://www.metanetwork.online/）
Meta Space Console 元空间控制台 （https://meta-space-console.metanetwork.online）
Meta Space Launcher 元空间启动器 （https://www.metaspaces.me/）
Meta Space 元空间 （https://<Custom Domain>.metaspaces.me/）
Meta Data Viewer 元数据查看器 vercel
Meta Link 元链接 （Not launch yet）

【Telegram】Meta Network CN https://t.me/metanetwork_cn
【Telegram】Meta Network https://t.me/metanetwork
【Telegram】Meta Network News https://t.me/metnetwork_news
【Discord】Meta Network https://t.co/iMYGY7iTx6
【Medium】Meta Network https://medium.com/meta-network
【Twitter】@realMetaNetwork https://twitter.com/realMetaNetwork
【Telegram】Matataki https://t.me/smartsignature_io

    
    
# Welcome aboard Meta Space

Hello Captain!

Welcome to Meta Space! 
The Meta Team wants to create Meta Space as a sustainably built virtual digital identity, your metadata display space.

The era of Web 2.0 is shaky - since Darcy DiNucci coined the term in 1999, issues such as copyright protection, privacy control, data validation, identity continuity, data control, and information censorship have been present and increasingly worrisome, issues that have held creators back for over two decades. These pain points will be better solved in the next Web 3.0 era. For the first time in history, humanity will be connected as a whole in the future through the metadata universe and social tokens. There are countless others like you on the road to Web3.0 and many more creators who will be inspired to join the Web3 fleet in the future.

## What is Meta Space

Unlike the social networks that people have become accustomed to, Meta Space is a space that is entirely personal to you. Your creations are stored in a controlled space designated by you, published to your domain, and the entire submission and publication process is verified by verifiable metadata. In other words, you are the platform, and you control all the traffic, revenue, and data copyright. If you wish, your past creations will be safely returned to your Meta Space shortly through various migration tools invented by the community and us. Meta Space is the starship that will carry you to the Web 3.0 metadata universe.


For those of you reading this:
If you want the precious content you create to be stored forever,
If you wish your creation-to-publication process to be free from the evils of the platform,
If you're going to have access to a display space entirely under your control,
If you're going to be ready to enter the Web 3.0 world from now on-

You are welcome to create your own Meta Space here!
If you're an old Matataki user, this is your new home!

## Why Meta Space

Meta Space is a stand-alone site that can exist off the platform, a showcase for your creative metadata, and a sustainable digital identity essential for your entry into Web 3.0.

We've taken the favorite parts of our previous product, Matataki, and enhanced them all while providing a de-platformed experience. The following features are just a few.

**De-platformed experience**
Meta Space is a tool only; you create and control the platform.

**Markdown**
We know you love Markdown writing, and so do we.

**Decentralized Storage**
Are you tired of getting your posts deleted? Try decentralized storage!

**Proved Creating**
We provide a traceable and verifiable proofing tool for every step of the process!

**Secured Creating**
All creations are done locally, and we - no one other than you - have the right to interfere.

**Metadata**
All content and material is based on decentralized stored metadata, preserving the NFT creation space.

**Social Token**
Fan ticket, the core value tool in the previous generation product Matataki, will return to Meta Space in the future.

**More features for the future**
We have envisioned a future world where
- I want to be able to have an identity on the Internet that I can control, and that is permanent.
- I want to be able to access any social media without the burden of friend transfer.
- I want to connect with even just 1,000 real followers rather than focusing on vanity metrics - traffic.
- I want to earn an income and support myself by only going into what I love and am good at.
- I want to be free to control my lifestyle and no longer be kidnapped by the so-called notion of success.
- I want a form of Web 3.0 where individuals take metadata and data into their own hands.
- The Web3.0 form I want is one in which the platform is responsible for good form, the individual is responsible for good content, and the network is responsible for good socialization.

Our products are future-proof and passionately moving towards the "creator economy" - more features will come in the future, so feel free to contact us, and thanks for all the feedback!
`,
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                name: 'meta-cms-test',
              },
              metaSpace: {
                baseDomain: 'metaspaces.life',
              },
              metaSignature: {
                serverKeys,
                serverDomain,
              },
              defaultPost,
            }),
          ],
        }),
        WinstonModule.forRootAsync({
          inject: [configService],
          useClass: WinstonConfigService,
        }),
      ],
      providers: [
        {
          provide: DeploySiteOrdersBaseService,
          inject: [WINSTON_MODULE_NEST_PROVIDER],
          useFactory: (logger) =>
            new DeploySiteOrdersBaseService(logger, undefined),
        },
        {
          provide: PublishSiteOrdersBaseService,
          inject: [WINSTON_MODULE_NEST_PROVIDER],
          useFactory: (logger) =>
            new PublishSiteOrdersBaseService(logger, undefined),
        },
        {
          provide: PostOrdersLogicService,
          inject: [
            WINSTON_MODULE_NEST_PROVIDER,
            ConfigService,
            ServerVerificationBaseService,
          ],
          useFactory: (logger, configService, serverVerificationBaseService) =>
            new PostOrdersLogicService(
              logger,
              configService,
              undefined,
              serverVerificationBaseService,
              undefined,
              undefined,
              undefined,
            ),
        },
        {
          provide: SiteConfigLogicService,
          inject: [ConfigService],
          useFactory: (config) =>
            new SiteConfigLogicService(undefined, undefined, config),
        },
        {
          provide: ServerVerificationBaseService,
          inject: [WINSTON_MODULE_NEST_PROVIDER],
          useFactory: (logger) =>
            new ServerVerificationBaseService(logger, undefined),
        },

        SiteOrdersLogicService,
      ],
    }).compile();

    deploySiteOrdersBaseService = module.get<DeploySiteOrdersBaseService>(
      DeploySiteOrdersBaseService,
    );
    publishSiteOrdersBaseService = module.get<PublishSiteOrdersBaseService>(
      PublishSiteOrdersBaseService,
    );
    postOrdersLogicService = module.get<PostOrdersLogicService>(
      PostOrdersLogicService,
    );
    siteConfigLogicService = module.get<SiteConfigLogicService>(
      SiteConfigLogicService,
    );
    serverVerificationBaseService = module.get<ServerVerificationBaseService>(
      ServerVerificationBaseService,
    );
    service = module.get<SiteOrdersLogicService>(SiteOrdersLogicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveDeploySiteOrder', () => {
    it('create deploySiteOrderRequestDto', async () => {
      console.log(
        JSON.stringify({
          siteConfigId: 214,
        }),
      );
    });
    it('should return deploySiteOrderResponseDto', async () => {
      const siteConfigId = 11;
      const deploySiteOrderRequestDto = {
        siteConfigId,
      } as DeploySiteOrderRequestDto;
      // console.log(
      //   'deploySiteOrderRequestDto',
      //   JSON.stringify(deploySiteOrderRequestDto),
      // );

      jest
        .spyOn(siteConfigLogicService, 'validateSiteConfigUserId')
        .mockImplementation(
          async (siteConfigId: number, userId: number, options) => {
            const siteConfigEntity = {
              id: siteConfigId,
              siteInfo: { userId },
            } as SiteConfigEntity;
            return siteConfigEntity;
          },
        );
      jest
        .spyOn(postOrdersLogicService, 'savePostOrder')
        .mockImplementation(async (userId: number, postOrderRequestDto) => {
          return {
            postOrder: {
              id: '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
              userId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              postMetadata: {
                id: '0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b',
                '@context': 'https://metanetwork.online/ns/cms',
                '@type': 'author-post-digest',
                '@version': '1.1.0',
                algorithm: 'sha256',
                title: '测试标题',
                content: '测试内容',
                summary: '测试内容',
                cover: 'https://example.com/test-cover.png',
                categories: '测试分类',
                tags: '测试标签1,测试标签2',
                license: 'CC 4.0',
                digest:
                  '0x6128a1423ac8239101ef76ee2c730452da0af0581685837de65b6853a2497ff9',
                ts: 1643357435230,
                authorPublicKey:
                  '0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e',
                createdAt: new Date(),
              },
              serverVerificationId:
                '0xe7c305eb985f9b97da5795550873da24b6fc8e8ff2447500a666b8e09c9a61e4d192fed5cd2b12b9630836d8c93293ea35cc92103efa8f52d21a3182fe27d30e',
              submitState: PipelineOrderTaskCommonState.PENDING,
              publishState: PipelineOrderTaskCommonState.PENDING,
            },
            serverVerification: {
              '@context': 'https://metanetwork.online/ns/cms',
              '@type': 'server-verification-sign',
              '@version': '2.0.0',
              signatureAlgorithm: 'curve25519',
              publicKey:
                '0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f',
              nonce: '0x1ee5789d5b0ac18d121a6dea',
              claim:
                "I, meta-cms.vercel.mttk.net, signed with my key 0x7660c1fc42a2d9aa3f0a4551db9e63f169ecfd56571add56622a6e4824162f1f: I verified the request signed with 0x7b0cd3a068527a29037e331b4baa4238807b24defe6ae4d8f880d075adb99fd8b4a65321cd904b107a0d4008229bd902dbdea1b4c10fae349142c71029898e8b using the author's key 0x54f329c1651d2281eb6dca96a0bdb70e2cc3821905bcb853db935f0180aa8a4e, will publish the post and upload its metadata for notarization.",
              signature:
                '0xe7c305eb985f9b97da5795550873da24b6fc8e8ff2447500a666b8e09c9a61e4d192fed5cd2b12b9630836d8c93293ea35cc92103efa8f52d21a3182fe27d30e',
              ts: 1643357435538,
              reference: [],
            },
          };
        });
      jest
        .spyOn(deploySiteOrdersBaseService, 'save')
        .mockImplementation(async (deploySiteOrderEntity) => {
          return deploySiteOrderEntity;
        });
      jest
        .spyOn(deploySiteOrdersBaseService, 'getBySiteConfigUserId')
        .mockImplementation(async (siteConfigId: number, userId: number) => {
          return undefined;
        });
      const userId = 1;
      const deploySiteOrder = await service.saveDeploySiteOrder(
        userId,
        deploySiteOrderRequestDto,
      );
      expect(deploySiteOrder).toBeDefined();
    });
  });
  describe('createDefaultPostOrderRequestDto', () => {
    it('Should be valid', () => {
      const postOrderRequestDto = service.createDefaultPostOrderRequestDto();
      expect(postOrderRequestDto).toBeDefined();
      expect(postOrderRequestDto.authorPostDigest.title).toEqual(
        defaultPost.title,
      );
      expect(postOrderRequestDto.authorPostDigest.content).toEqual(
        defaultPost.content,
      );
      expect(postOrderRequestDto.authorPostDigest.tags).toEqual(
        defaultPost.tags,
      );
      expect(postOrderRequestDto.authorPostDigest.categories).toEqual(
        defaultPost.categories,
      );
      expect(postOrderRequestDto.authorPostDigest.cover).toEqual('');
      expect(postOrderRequestDto.authorPostDigest.license).toEqual('');
      expect(postOrderRequestDto.authorPostSign.digest).toEqual(
        postOrderRequestDto.authorPostDigest.digest,
      );
      expect(
        authorPostDigestSign.verify(postOrderRequestDto.authorPostSign),
      ).toBeTruthy();
    });
  });
});
