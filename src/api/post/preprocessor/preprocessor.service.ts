import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PreProcessorService {
  constructor(private readonly httpService: HttpService) {}

  async preprocess(content: string) {
    const { data } = await lastValueFrom(
      this.httpService.post<string>('/process', content, {
        headers: {
          'Content-Type': 'text/plain',
        },
      }),
    );

    return data;
  }
}
