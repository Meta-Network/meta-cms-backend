import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import type { SourceService } from '../../source-service.interface';

@Injectable()
export class MatatakiSourceService implements SourceService {
  constructor(private readonly httpService: HttpService) {}

  async fetch(path: string) {
    const { data } = await lastValueFrom(
      this.httpService.get<{ content: string }>(path),
    );

    return data.content;
  }
}
