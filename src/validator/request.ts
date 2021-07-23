import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { PUBLIC_KEYS, verify } from '@meta-network/auth-sdk';
import {
  JWTAudNotMatchException,
  JWTException,
  JWTExpiredException,
  RequirdHttpHeadersNotFoundException,
} from '../exceptions';
import { UCenterJWTPayload } from 'src/types';

export const validateRequestCookie = (
  req: Request,
): [boolean, UCenterJWTPayload] => {
  const cookie = req.cookies;
  if (!cookie || !cookie.ucenter_accessToken) {
    throw new RequirdHttpHeadersNotFoundException();
  }
  const token: string = cookie.ucenter_accessToken;
  const audienceId = 'cms';

  try {
    const decodedJwtPayload = verify(
      token,
      audienceId,
      PUBLIC_KEYS.DEVELOPMENT,
    );

    return [true, decodedJwtPayload as UCenterJWTPayload];
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new JWTExpiredException();
    }

    if (
      error instanceof JsonWebTokenError &&
      error.message.includes('audience')
    ) {
      throw new JWTAudNotMatchException();
    }

    throw new JWTException(error.message);
  }
};

export default validateRequestCookie;
