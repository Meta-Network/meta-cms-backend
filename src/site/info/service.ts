import { Injectable } from '@nestjs/common';

@Injectable()
export class SiteInfoService {
  getSiteInfo() {
    return {
      id: 0,
      title: 'matataki-site',
      subtitle: 'subtitles',
      description: 'this is a site.',
      keywords: null,
      author: 'John Doe',
      icon: null,
      linkedAccount: '',
    };
  }
}
