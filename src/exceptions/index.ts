import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

export class JWTAudNotMatchException extends UnauthorizedException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized: JWT aud not match',
      },
      'JWTAudNotMatchException',
    );
  }
}

export class JWTExpiredException extends UnauthorizedException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized: JWT expired',
      },
      'JWTExpiredException',
    );
  }
}

export class RequirdHttpHeadersNotFoundException extends HttpException {
  constructor() {
    super(
      'Bad Request: required http headers not found',
      HttpStatus.BAD_REQUEST,
    );
  }
}
