import {
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { CMSAuthenticationService } from '../../../auth/cms/service';
import {
  AccessDeniedException,
  ValidationException,
} from '../../../exceptions';
import { isDevelopment } from '../../../utils';
import { ManagementEthereumService } from '../ethereum/service';
import {
  ManagementAuthorizationDto,
  ManagementAuthorizationWithToken,
} from './dto';

@Injectable()
export class ManagementAuthorizationService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly ethereumService: ManagementEthereumService,
    private readonly cmsAuthService: CMSAuthenticationService,
  ) {
    const expiresInMinutes = this.configService.get<number>(
      'management.authorization.expiresInMinutes',
      5,
    );
    this.expiresMs = expiresInMinutes * 60 * 1000;
  }

  private readonly expiresMs: number;

  public async login(
    authDto: ManagementAuthorizationDto,
  ): Promise<ManagementAuthorizationWithToken> {
    this.logger.verbose(
      `Account ${authDto.user} request login`,
      this.constructor.name,
    );
    const nowMs = Date.now();
    const authMs = Number(authDto.timestamp);
    const isExpired = Math.abs(nowMs - authMs) > this.expiresMs;
    if (isExpired && !isDevelopment())
      throw new ValidationException('request timestamp expired or invalid');
    try {
      const verify = await this.ethereumService.verifyAuthorization(authDto);
      if (!verify) throw new AccessDeniedException();
      const { token } = await this.cmsAuthService.managementJWTSign(
        authDto.user,
      );
      return { authInfo: authDto, token };
    } catch (error) {
      if (error instanceof AccessDeniedException) throw error;
      if (error instanceof Error && error.message.includes('AccessControl')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw new AccessDeniedException(error.reason);
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
