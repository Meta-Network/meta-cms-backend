import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from '@nestjs/microservices';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { parse as cookieParse } from 'cookie';

import { UCenterAuthService } from '../../auth/ucenter/service';
import { configBuilder } from '../../configs';
import type {
  InvitationCountData,
  PostPublishNotification,
  StateData,
  VerifiedSocket,
} from '../../types';
import { StateNotification } from '../../types';
import {
  InternalRealTimeEvent,
  RealTimeEventState,
  RealTimeNotificationEvent,
} from '../../types/enum';
import {
  InternalRealTimeMessage,
  RealTimeNotification,
} from './real-time-event.datatype';

@WebSocketGateway({
  cookie: true,
  cors: {
    credentials: true,
    // can't use '*' here because of the cors limit,
    // also no ConfigService instance is available in this scope,
    // thus use configBuilder here
    origin: configBuilder().cors.origins,
  },
})
export class RealTimeEventGateway {
  @WebSocketServer()
  private server: Server;
  private logger = new Logger(RealTimeEventGateway.name);
  private clients = new Map<number, VerifiedSocket[]>();

  constructor(private readonly ucenterAuthService: UCenterAuthService) {}

  getPostsCount() {
    // fake data; for mock test
    const publishedCount = 12;
    const publishingCount = 12;
    return {
      publishingCount,
      publishedCount,
      allPostCount: publishedCount + publishingCount,
    };
  }

  getUserClients(userId: number) {
    return this.clients.get(userId) ?? [];
  }

  async handleConnection(client: VerifiedSocket) {
    let userId: number;
    const req = { cookies: cookieParse(client.handshake.headers.cookie ?? '') };

    try {
      userId = parseInt(
        (await this.ucenterAuthService.validateJWT(req as any)).sub,
      );
    } catch (error) {
      client.disconnect(true);
      this.logger.log(
        `User connection failed, with socket id ${client.id}. Error: ${error}`,
      );
      return;
    }

    client.userId = userId;
    const userClients = this.getUserClients(userId);
    userClients.push(client);

    this.clients.set(userId, userClients);
    this.logger.log(`User(id: ${userId}) connected with socket ${client.id}`);
  }

  /**
   * Cleanup user's socket connection
   * @param {VerifiedSocket} client
   */
  handleDisconnect(client: VerifiedSocket) {
    if (client.userId === undefined) {
      return;
    }
    const userClients = this.getUserClients(client.userId);
    const clientIndex = userClients.findIndex((e) => e === client);
    userClients.splice(clientIndex, 1);
    this.logger.log(
      `User ${client.userId} disconnected with socket ${client.id}`,
    );
  }

  @OnEvent(InternalRealTimeEvent.POST_STATE_UPDATED)
  async onPostStateUpdate(
    internalMessage: InternalRealTimeMessage<StateData[]>,
  ): Promise<void> {
    // default implementation
    const notification: RealTimeNotification<StateNotification> =
      new RealTimeNotification({
        message: RealTimeNotificationEvent.POST_COUNT_UPDATED, // 'post.count.updated'
        data: {},
      });
    const userClients = this.getUserClients(internalMessage.userId);

    // if a post is failed, send the notification with an alert flag
    if (
      internalMessage.data.some((state) =>
        Object.values(state).includes(RealTimeEventState.failed),
      )
    ) {
      (notification.data as PostPublishNotification).publishingAlertFlag = true;
    }

    // if some posts are pending to submit or published, update the count
    if (
      internalMessage.data.some(
        (state) =>
          state.submit === RealTimeEventState.pending ||
          state.publish === RealTimeEventState.finished,
      )
    ) {
      notification.data = { ...this.getPostsCount(), ...notification.data };
    }

    // if we have the data
    if (Object.keys(notification.data).length > 0) {
      // emitting the data
      userClients.forEach((client) => {
        client.emit(RealTimeNotificationEvent.POST_COUNT_UPDATED, notification);
      });
    } else {
      // else emitting the event without any data
      userClients.forEach((client) => {
        client.emit(RealTimeNotificationEvent.POST_PUBLISHING_STATE_UPDATED, {
          stateChanged: true,
        });
      });
    }
  }

  @OnEvent(InternalRealTimeEvent.INVITATION_COUNT_UPDATED)
  async onInvitationCountUpdated(
    internalMessage: InternalRealTimeMessage<InvitationCountData>,
  ): Promise<void> {
    const userClients = this.getUserClients(internalMessage.userId);
    userClients.forEach((client) => {
      client.emit(
        RealTimeNotificationEvent.INVITATION_COUNT_UPDATED,
        internalMessage.data,
      );
    });
  }
}
