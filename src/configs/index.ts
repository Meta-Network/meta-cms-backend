import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { join } from 'path';

import { configPath } from '../constants';

const YAML_CONFIG_FILENAME =
  process.env.NODE_ENV === 'production'
    ? 'config.production.yaml'
    : 'config.development.yaml';

const filePath = join(configPath, YAML_CONFIG_FILENAME);

export const configBuilder = () => {
  return yaml.load(readFileSync(filePath, 'utf8')) as Record<string, any>;
};
