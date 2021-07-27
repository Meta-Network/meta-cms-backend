import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

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

export const validationErrorToBadRequestException = (
  errors: unknown[],
): BadRequestException => {
  if (errors && errors[0] instanceof ValidationError) {
    const error = errors[0];
    return new BadRequestException(
      `Bad Request: ${Object.values(error.constraints)[0]}`,
    );
  }
};
