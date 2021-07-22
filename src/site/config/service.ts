import { Injectable } from '@nestjs/common';

@Injectable()
export class SiteConfigService {
  getSiteConfig(uid: number) {
    return {
      id: 0,
      language: 'en-US',
      timezone: 'UTC+8',
      theme: 'landscape',
      platform: 'github',
      subdomain: 'example.com'
    }
  }
}
