import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePlatformPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (!['matataki', 'editor'].includes(value)) {
      throw new BadRequestException('Invalid platform');
    }

    return value;
  }
}
