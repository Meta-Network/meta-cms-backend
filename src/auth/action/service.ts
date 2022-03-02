import { Injectable, InternalServerErrorException } from '@nestjs/common';
import assert from 'assert';

import { ManagementAction } from '../../ethereum/management/dto';
import { ManagementEthereumService } from '../../ethereum/management/service';
import { AccessDeniedException, ValidationException } from '../../exceptions';

@Injectable()
export class ActionAuthorizationService {
  constructor(private readonly ethereumService: ManagementEthereumService) {}

  public async verifyAddressMatch(
    user: string,
    initiator: string,
  ): Promise<boolean> {
    assert(user, new ValidationException(`user address undefined`));
    assert(initiator, new ValidationException(`initiator address undefined`));
    try {
      const userAddress = this.ethereumService.verifyAddress(user);
      const initiatorAddress = this.ethereumService.verifyAddress(initiator);
      return userAddress === initiatorAddress;
    } catch (error) {
      if (error instanceof Error && error.message.includes('address')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw new ValidationException(`${error.reason} ${error.value}`);
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  public async verifyAction(action: ManagementAction): Promise<boolean> {
    assert(
      action?.initiator,
      new ValidationException(`action body initiator undefined`),
    );
    assert(action?.name, new ValidationException(`action body name undefined`));
    assert(
      action?.signature,
      new ValidationException(`action body signature undefined`),
    );
    try {
      const verify = await this.ethereumService.verifyAction(action);
      if (!verify) throw new AccessDeniedException();
      return verify;
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

  public async verifyRole(roles: string[], request: string): Promise<boolean> {
    const hasRole = roles.includes(request);
    assert(
      hasRole,
      new AccessDeniedException(`action name ${request} not allowed`),
    );
    return hasRole;
  }
}
