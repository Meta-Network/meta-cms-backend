import path from 'path';

export const CONFIG_PATH =
  process.env.CONFIG_PATH || path.join(__dirname, '..', '..', 'config');

export const CACHE_KEY_PUB_PROV_ID = 'CACHE_KEY_PUBLISHER_PROVIDER_ID';
export const CACHE_KEY_PUB_TARGET_URL = 'CACHE_KEY_PUBLISHER_TARGET_URL';
