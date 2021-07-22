import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { PUBLIC_KEYS, verify } from '@meta-network/auth-sdk';
import {
  JWTAudNotMatchException,
  JWTException,
  JWTExpiredException,
  RequirdHttpHeadersNotFoundException,
} from '../exceptions';

export const validateRequest = (req: Request): boolean => {
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
    console.log('Token:', token, 'Payload:', decodedJwtPayload);

    return true;
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

export default validateRequest;
