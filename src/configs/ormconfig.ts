import { ConnectionOptions } from 'typeorm';
import { GitHubStorageProviderEntity } from 'src/entities/provider/storage/github.entity';
import { SiteConfigEntity } from 'src/entities/siteConfig.entity';
import { SiteInfoEntity } from 'src/entities/siteInfo.entity';
import { ThemeTemplateEntity } from 'src/entities/themeTemplate.entity';
import { configBuilder } from 'src/configs/index';

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
  port: config.db.port || 3306,
  connectTimeout: 60 * 60 * 1000,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  entities: [
    SiteInfoEntity,
    SiteConfigEntity,
    ThemeTemplateEntity,
    GitHubStorageProviderEntity,
  ],
  synchronize: false,
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
