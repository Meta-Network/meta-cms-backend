import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

export class JWTException extends ForbiddenException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Forbidden: JWTException: ${message}`,
      },
      'JWTException',
    );
  }
}

export class JWTAudNotMatchException extends UnauthorizedException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized: jwt audience not match',
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
        message: 'Unauthorized: jwt expired',
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
