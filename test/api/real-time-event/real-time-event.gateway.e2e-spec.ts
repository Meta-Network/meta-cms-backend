import { INestApplication } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { connect, Socket } from 'socket.io-client';

import { InternalRealTimeMessage } from '../../../src/api/real-time-event/real-time-event.datatype';
import { RealTimeEventGateway } from '../../../src/api/real-time-event/real-time-event.gateway';
import { UCenterAuthService } from '../../../src/auth/ucenter/service';
import {
  InternalRealTimeEvent,
  RealTimeEventState,
  RealTimeNotificationEvent,
} from '../../../src/types/enum';

describe('RealTimeEventGateway (e2e)', () => {
  let app: INestApplication;
  let eventEmitter: EventEmitter2;
  let socket: Socket;
  let url; // assigned in beforeAll() for the socket.io-client connect()

  // Mock auth service, so we're not validating the real token
  // but the cookies are required to be passed to the server
  const MockAuthService = {
    validateJWT: (req: Request) => ({
      sub: req.cookies.user_id,
    }),
  };

  const getSocketCookiesForUser = (userId: number) => ({
    transportOptions: {
      polling: {
        extraHeaders: {
          Cookie: `user_id=${userId};`,
        },
      },
    },
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        {
          provide: UCenterAuthService,
          useValue: MockAuthService,
        },
        RealTimeEventGateway,
      ],
    })
      .overrideProvider(UCenterAuthService)
      .useClass(MockAuthService)
      .compile();

    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);

    app = moduleRef.createNestApplication();
    await app.init();

    await app.listen(8991);
    url = await app.getUrl();

    // wait for the connections to be established
    socket = connect(url, getSocketCookiesForUser(1));
    return new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });
  });

  it('should be able to connect to the server', () => {
    expect(socket.connected).toBe(true);
  });

  it('should handle the event from EventEmitter2, and send a notification', (done) => {
    socket.on(RealTimeNotificationEvent.POST_COUNT_UPDATED, (data) => {
      expect(data).toEqual({
        statusCode: 200,
        retryable: false,
        data: { publishingCount: 12, publishedCount: 12, allPostCount: 24 },
        message: 'post.count.updated',
      });
      done();
    });

    eventEmitter.emit(
      InternalRealTimeEvent.POST_STATE_UPDATED,
      new InternalRealTimeMessage({
        userId: 1,
        message: InternalRealTimeEvent.POST_STATE_UPDATED,
        data: [
          {
            id: 10,
            submit: RealTimeEventState.pending,
            publish: RealTimeEventState.pending,
          },
        ],
      }),
    );
  });

  it('should send the notification to the correct user', (done) => {
    const user2 = connect(url, getSocketCookiesForUser(2));

    user2.on('connect', () => {
      eventEmitter.emit(
        InternalRealTimeEvent.POST_STATE_UPDATED,
        new InternalRealTimeMessage({
          userId: 1,
          message: InternalRealTimeEvent.POST_STATE_UPDATED,
          data: [
            {
              id: 10,
              submit: RealTimeEventState.pending,
              publish: RealTimeEventState.pending,
            },
          ],
        }),
      );
    });

    socket.on(RealTimeNotificationEvent.POST_COUNT_UPDATED, () => {
      // make it done after 100ms when the correct user(id 1) receives the notification
      // this is to make sure user2 doesn't receive the notification
      setTimeout(() => {
        user2.disconnect();
        // test is successful
        done();
      }, 100);
    });

    user2.on(RealTimeNotificationEvent.POST_COUNT_UPDATED, () => {
      user2.disconnect();
      // terminate the test
      done(new Error('user2 should not receive the notification'));
    });
  });

  afterEach(() => {
    // stop listening to the current events for the next test
    socket.off();
  });

  afterAll(async () => {
    socket.disconnect();
    await app.close();
  });
});
