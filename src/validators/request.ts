import { Request } from 'express';
import { RequirdHttpHeadersNotFoundException } from 'src/exceptions';

export const validateRequest = (req: Request): boolean => {
  const setCookie = req.get('set-cookie');
  console.log('setCookie:', setCookie);
  if (!setCookie) {
    throw new RequirdHttpHeadersNotFoundException();
  }
  return false;
};

export default validateRequest;
