import { ConnectionOptions } from 'typeorm';
import { SiteConfigEntity } from '../entities/siteConfig';
import { SiteInfoEntity } from '../entities/siteInfo';
import AppConfig from './index';

interface Config {
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

const config = AppConfig() as Config;

const options: ConnectionOptions = {
  type: 'mysql',
  host: config.db.host,
  port: config.db.port || 3306,
  connectTimeout: 60 * 60 * 1000,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  entities: [SiteInfoEntity, SiteConfigEntity],
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
