import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from '@nestjs/microservices';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { parse as cookieParse } from 'cookie';

import { UCenterAuthenticationService } from '../../auth/ucenter/service';
import type { StateData, VerifiedSocket } from '../../types';
import {
  InternalRealTimeEvent,
  RealTimeNotificationEvent,
} from '../../types/enum';
import { PostOrdersLogicService } from '../pipelines/post-orders/post-orders.logic.service';
import {
  InternalRealTimeMessage,
  RealTimeNotification,
} from './real-time-event.datatype';

@WebSocketGateway({
  cookie: true,
  cors: {
    credentials: true,
    // true means '*'
    origin: true,
  },
})
export class RealTimeEventGateway {
  @WebSocketServer()
  private server: Server;
  private logger = new Logger(RealTimeEventGateway.name);
  private clients = new Map<number, VerifiedSocket[]>();

  constructor(
    private readonly ucenterAuthService: UCenterAuthenticationService,
    private readonly postOrdersLogicService: PostOrdersLogicService,
  ) {}

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
    this.logger.log(
      `User(id: ${userId}) connected with socket id ${client.id}`,
    );
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
    internalMessage: InternalRealTimeMessage,
  ): Promise<void> {
    // default implementation
    const notification = new RealTimeNotification({
      message: RealTimeNotificationEvent.POST_COUNT_UPDATED, // 'post.count.updated'
      data: {} as any,
    });
    const userClients = this.getUserClients(internalMessage.userId);

    // if some posts publish states are changed, update the count
    if ((internalMessage.data as StateData[]).some((state) => state.publish)) {
      notification.data =
        await this.postOrdersLogicService.countUserPostOrdersAsNotification(
          internalMessage.userId,
        );
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
    internalMessage: InternalRealTimeMessage,
  ): Promise<void> {
    const userClients = this.getUserClients(internalMessage.userId);
    userClients.forEach((client) => {
      client.emit(
        RealTimeNotificationEvent.INVITATION_COUNT_UPDATED,
        new RealTimeNotification({
          message: RealTimeNotificationEvent.INVITATION_COUNT_UPDATED, // 'post.count.updated'
          data: internalMessage.data,
        }),
      );
    });
  }
}
