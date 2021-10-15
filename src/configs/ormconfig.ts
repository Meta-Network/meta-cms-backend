import { ConnectionOptions } from 'typeorm';

import { AccessTokenEntity } from '../entities/accessToken.entity';
import { DraftEntity } from '../entities/draft.entity';
import { MatatakiSyncEntity } from '../entities/matatakiSync.entity';
import { PostEntity } from '../entities/post.entity';
import { PostSiteConfigRelaEntity } from '../entities/postSiteConfigRela.entity';
import { GitHubPublisherProviderEntity } from '../entities/provider/publisher/github.entity';
import { GitHubStorageProviderEntity } from '../entities/provider/storage/github.entity';
import { SiteConfigEntity } from '../entities/siteConfig.entity';
import { SiteInfoEntity } from '../entities/siteInfo.entity';
import { SynchronizerEntity } from '../entities/synchromizer.entity';
import { ThemeEntity } from '../entities/theme.entity';
import { ThemeTemplateEntity } from '../entities/themeTemplate.entity';
import { configBuilder } from './index';

interface Config {
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
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
  entities: [
    SiteInfoEntity,
    SiteConfigEntity,
    ThemeTemplateEntity,
    ThemeEntity,
    GitHubStorageProviderEntity,
    GitHubPublisherProviderEntity,
    AccessTokenEntity,
    PostEntity,
    PostSiteConfigRelaEntity,
    SynchronizerEntity,
    MatatakiSyncEntity,
    DraftEntity,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
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
