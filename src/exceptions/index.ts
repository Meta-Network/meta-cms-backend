import { ValidationError } from 'class-validator';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class JWTException extends ForbiddenException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Forbidden: JWTException: ${message}`,
      },
      'Forbidden',
    );
  }
  @ApiProperty({ example: HttpStatus.FORBIDDEN })
  readonly statusCode: string;
  @ApiProperty({ example: 'Forbidden: JWTException' })
  readonly message: string;
}

export class JWTAudNotMatchException extends UnauthorizedException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized: jwt audience not match',
      },
      'Unauthorized',
    );
  }
  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  readonly statusCode: string;
  @ApiProperty({ example: 'Unauthorized: jwt audience not match' })
  readonly message: string;
}

export class JWTExpiredException extends UnauthorizedException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized: jwt expired',
      },
      'Unauthorized',
    );
  }
  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  readonly statusCode: string;
  @ApiProperty({ example: 'Unauthorized: jwt expired' })
  readonly message: string;
}

export class RequirdHttpHeadersNotFoundException extends BadRequestException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request: required http headers not found',
      },
      'Bad Request',
    );
  }
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  readonly statusCode: string;
  @ApiProperty({ example: 'Bad Request: required http headers not found' })
  readonly message: string;
}

export class RequestNotAcceptableException extends NotAcceptableException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'Not Acceptable: this request is not allowed',
      },
      'Not Acceptable',
    );
  }
  @ApiProperty({ example: HttpStatus.NOT_ACCEPTABLE })
  readonly statusCode: string;
  @ApiProperty({ example: 'Not Acceptable: this request is not allowed' })
  readonly message: string;
}

export class AccessDeniedException extends ForbiddenException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden: access denied',
      },
      'Forbidden',
    );
  }
  @ApiProperty({ example: HttpStatus.FORBIDDEN })
  readonly statusCode: string;
  @ApiProperty({ example: 'Forbidden: access denied' })
  readonly message: string;
}

export class ValidationException extends BadRequestException {
  constructor(message = 'validation error') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Bad Request: ${message}`,
      },
      'Bad Request',
    );
  }
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  readonly statusCode: string;
  @ApiProperty({ example: 'Bad Request: validation error' })
  readonly message: string;
}

export class DataNotFoundException extends NotFoundException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found: data not found',
      },
      'Not Found',
    );
  }
  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  readonly statusCode: string;
  @ApiProperty({ example: 'Not Found: data not found' })
  readonly message: string;
}

export class ResourceIsInUseException extends ConflictException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Conflict: the requested resource is in use',
      },
      'Conflict',
    );
  }
  @ApiProperty({ example: HttpStatus.CONFLICT })
  readonly statusCode: string;
  @ApiProperty({ example: 'Conflict: the requested resource is in use' })
  readonly message: string;
}

export const validationErrorToBadRequestException = (
  errors: unknown[],
): BadRequestException => {
  if (errors && errors[0] instanceof ValidationError) {
    const error = errors[0];
    return new ValidationException(Object.values(error.constraints)[0]);
  }
  if (errors instanceof Error) {
    throw errors;
  }
};
