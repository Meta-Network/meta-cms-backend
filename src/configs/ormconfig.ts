import { ConnectionOptions } from 'typeorm';

import { AccessTokenEntity } from '../entities/accessToken.entity';
import { DraftEntity } from '../entities/draft.entity';
import { MatatakiSyncEntity } from '../entities/matatakiSync.entity';
import { DeploySiteOrderEntity } from '../entities/pipeline/deploy-site-order.entity';
import { DeploySiteTaskEntity } from '../entities/pipeline/deploy-site-task.entity';
import { PostMetadataEntity } from '../entities/pipeline/post-metadata.entity';
import { PostOrderEntity } from '../entities/pipeline/post-order.entity';
import { PostTaskEntity } from '../entities/pipeline/post-task.entity';
import { PublishSiteOrderEntity } from '../entities/pipeline/publish-site-order.entity';
import { PublishSiteTaskEntity } from '../entities/pipeline/publish-site-task.entity';
import { ServerVerificationEntity } from '../entities/pipeline/server-verification.entity';
import { PostEntity } from '../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../entities/postSiteConfigRela.entity';
import { GiteePublisherProviderEntity } from '../entities/provider/publisher/gitee.entity';
import { GitHubPublisherProviderEntity } from '../entities/provider/publisher/github.entity';
import { GiteeStorageProviderEntity } from '../entities/provider/storage/gitee.entity';
import { GitHubStorageProviderEntity } from '../entities/provider/storage/github.entity';
import { SiteConfigEntity } from '../entities/siteConfig.entity';
import { SiteInfoEntity } from '../entities/siteInfo.entity';
import { SynchronizerEntity } from '../entities/synchromizer.entity';
import { ThemeEntity } from '../entities/theme.entity';
import { ThemeTemplateEntity } from '../entities/themeTemplate.entity';
import { isDevelopment } from '../utils';
import { configBuilder } from './index';

interface Config {
  db: {
    host: string;
    port: number;
    timezone: string;
    username: string;
    password: string;
    database: string;
    charset: string;
  };
}

const config = configBuilder() as Config;

const options: ConnectionOptions = {
  type: 'mysql',
  host: config.db.host,
  port: +config.db.port || 3306,
  connectTimeout: 60 * 60 * 1000,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  charset: config.db.charset || 'utf8mb4_0900_ai_ci',
  entities: [
    SiteInfoEntity,
    SiteConfigEntity,
    ThemeTemplateEntity,
    ThemeEntity,
    GitHubStorageProviderEntity,
    GitHubPublisherProviderEntity,
    GiteeStorageProviderEntity,
    GiteePublisherProviderEntity,
    AccessTokenEntity,
    PostEntity,
    PostSiteConfigRelaEntity,
    SynchronizerEntity,
    MatatakiSyncEntity,
    DraftEntity,
    PostOrderEntity,
    PostMetadataEntity,
    PostTaskEntity,
    DeploySiteOrderEntity,
    DeploySiteTaskEntity,
    PublishSiteOrderEntity,
    PublishSiteTaskEntity,
    ServerVerificationEntity,
  ],
  synchronize: false,
  timezone: config.db.timezone || 'Z',
  logging: isDevelopment(),
  migrationsTableName: 'be_migrations',
  migrations: [
    process.env.NODE_ENV === 'migration'
      ? 'src/migrations/**/*.ts'
      : 'migrations/**/*.ts',
  ],
  cli: {
    migrationsDir: 'src/migrations',
  },
};

export default options;
