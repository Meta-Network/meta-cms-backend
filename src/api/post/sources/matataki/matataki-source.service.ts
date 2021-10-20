import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';

import { IpfsGatewayTimeoutException } from '../../../../exceptions';
import type { SourceService } from '../../source-service.interface';

@Injectable()
export class MatatakiSourceService implements SourceService {
  constructor(private readonly httpService: HttpService) {}

  async fetch(path: string) {
    const nodes = [
      ['https://ipfs.fleek.co/ipfs/', 524] as const,
      ['https://ipfs.infura.io/ipfs/', 504] as const,
    ];

    while (nodes.length > 0) {
      const [prefix, timeoutStatusCode] = nodes.shift();

      try {
        return await this.fetchCore(prefix, path, timeoutStatusCode);
      } catch (e) {
        if (e instanceof IpfsGatewayTimeoutException) {
          continue;
        }

        throw e;
      }
    }

    throw new IpfsGatewayTimeoutException();
  }
  async fetchCore(prefix: string, path: string, timeoutStatusCode: number) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<{ content: string }>(prefix + path),
      );

      return data.content;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response.status === timeoutStatusCode) {
        throw new IpfsGatewayTimeoutException();
      }

      throw e;
    }
  }
}
