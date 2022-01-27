import { MetaInternalResult } from '@metaio/microservice-model';

import { InvitationCountData, StateData } from '../../types';
import type {
  InternalRealTimeEvent,
  RealTimeNotificationEvent,
} from '../../types/enum';

export class RealTimeNotification<
  StateNotification,
> extends MetaInternalResult<StateNotification> {
  retryable: false;
  message: RealTimeNotificationEvent;

  constructor(
    init: Partial<MetaInternalResult<StateNotification>> & {
      data: StateNotification;
    },
  ) {
    super(init);
  }
}

export class InternalRealTimeMessage extends MetaInternalResult<
  StateData[] | InvitationCountData
> {
  userId: number;
  message: InternalRealTimeEvent;
  retryable: false;

  constructor(
    init: Partial<InternalRealTimeMessage> & {
      userId: number;
      message: InternalRealTimeEvent;
      data: StateData[] | InvitationCountData;
    },
  ) {
    super(init);
    this.userId = init.userId;
  }
}
