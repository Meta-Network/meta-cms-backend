import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { ConnectionOptions } from 'typeorm';
import { SiteConfig } from '../entities/siteConfig';
import { SiteInfo } from '../entities/siteInfo';

interface Config {
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

const YAML_CONFIG_FILENAME =
  process.env.NODE_ENV === 'production'
    ? 'config.production.yaml'
    : 'config.development.yaml';

const config: Config = yaml.load(
  readFileSync(join(__dirname, '..', '..', YAML_CONFIG_FILENAME), 'utf8'),
) as Config;

const options: ConnectionOptions = {
  type: 'mysql',
  host: config.db.host,
  port: config.db.port || 3306,
  connectTimeout: 60 * 60 * 1000,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  entities: [SiteInfo, SiteConfig],
  synchronize: false,
  migrationsTableName: 'be_migrations',
  migrations: ['src/migrations/**/*.ts'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};

export default options;
