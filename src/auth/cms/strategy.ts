import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CMSManagementJWTPayload } from '../../types';
import { AuthGuardType } from '../../types/enum';
import { isDevelopment } from '../../utils';

@Injectable()
export class CMSJwtStrategy extends PassportStrategy(
  Strategy,
  AuthGuardType.CMS,
) {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.cms.symmetricKey'),
      issuer: configService.get<string>('jwt.cms.sign.issuer'),
      audience: configService.get<string>('jwt.cms.sign.audience'),
      algorithms: ['HS512'], // TODO: move to config
      ignoreExpiration: isDevelopment(),
    });
  }

  async validate(
    payload: CMSManagementJWTPayload,
  ): Promise<CMSManagementJWTPayload> {
    return payload;
  }
}
