import { Request } from 'express';

export const validateRequest = (req: Request): boolean => {
  const setCookie = req.get('set-cookie');
  console.log('setCookie:', setCookie);
  return false;
};

export default validateRequest;
