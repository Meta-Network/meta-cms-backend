import { MetaInternalResult } from '@metaio/microservice-model';
import { Controller } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { UserInvitationCountPayload } from '../../../types';
import { InternalRealTimeEvent } from '../../../types/enum';
import { InternalRealTimeMessage } from '../../real-time-event/real-time-event.datatype';
import { FetchSiteInfosReturn, SiteConfigLogicService } from './logicService';

@Controller()
export class SiteConfigMsController {
  constructor(
    private readonly service: SiteConfigLogicService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @EventPattern('user.invitation.count.updated')
  async handleUserInvitationCountUpdated(
    payload: MetaInternalResult<UserInvitationCountPayload>,
  ) {
    this.eventEmitter.emit(
      InternalRealTimeEvent.INVITATION_COUNT_UPDATED,
      new InternalRealTimeMessage({
        userId: payload.data.userId,
        message: InternalRealTimeEvent.INVITATION_COUNT_UPDATED,
        data: payload.data.count,
      }),
    );
  }

  @MessagePattern('syncSiteInfo')
  async syncSiteInfo(
    @Payload()
    queries: {
      modifiedAfter: Date;
    },
  ): Promise<MetaInternalResult<FetchSiteInfosReturn[]>> {
    return this.service.fetchSiteInfos(queries);
  }

  @MessagePattern('fetchUserDefaultSiteInfo')
  async fetchUserDefaultSiteInfo(
    @Payload()
    queries: {
      userId: number;
    },
  ): Promise<MetaInternalResult<FetchSiteInfosReturn>> {
    return this.service.fetchUserDefaultSiteInfo(queries);
  }
}
