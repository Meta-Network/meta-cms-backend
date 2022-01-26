import { MetaInternalResult } from '@metaio/microservice-model';

import type { StateNotification } from '../../types';
import type {
  InternalRealTimeEvent,
  RealTimeNotificationEvent,
} from '../../types/enum';

export class RealTimeNotification<
  T,
> extends MetaInternalResult<StateNotification> {
  retryable: false;
  message: RealTimeNotificationEvent;

  constructor(init: Partial<MetaInternalResult<T>> & { data: T }) {
    super(init);
  }
}

export class InternalRealTimeMessage<T> extends MetaInternalResult<T> {
  userId: number;
  message: InternalRealTimeEvent;
  retryable: false;

  constructor(
    init: Partial<InternalRealTimeMessage<T>> & {
      userId: number;
      message: InternalRealTimeEvent;
      data: T;
    },
  ) {
    super(init);
    this.userId = init.userId;
  }
}
