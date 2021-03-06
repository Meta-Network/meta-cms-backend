import { MetaWorker } from '@metaio/worker-model';

import { ValidationException } from '../../../exceptions';

const dnsProviderMap = {};
export function registerDnsProvider(
  dnsProviderType: MetaWorker.Enums.DnsProviderType,
  dnsProvider,
) {
  dnsProviderMap[dnsProviderType] = dnsProvider;
}
export function getDnsProvider(
  dnsProviderType: MetaWorker.Enums.DnsProviderType,
): DnsProvider {
  const instance = dnsProviderMap[dnsProviderType];
  if (!instance) {
    throw new ValidationException('Invalid DNS provider type');
  }
  return instance;
}

// export enum DnsProviderType {
//   CLOUDFLARE = 'CLOUDFLARE',
// }

// export type DnsConfig = {
//   providerType: DnsProviderType;
//   env: Record<string, any>;
// };
// export enum DnsRecordType {
//   A = 'A',
//   CNAME = 'CNAME',
// }
// export type DnsRecord = {
//   type: DnsRecordType;
//   name: string;
//   content: string;
// };
export interface DnsProvider {
  updateDnsRecord(dns: MetaWorker.Info.Dns);
}
