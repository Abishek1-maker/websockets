import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`✅ Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Disconnected: ${client.id}`);
  }

  // Send to EVERYONE
  @SubscribeMessage('send_message')
  handleMessage(@MessageBody() data: string) {
    this.server.emit('receive_message', data);
  }

  // Send back to ONLY sender
  @SubscribeMessage('private_message')
  handlePrivate(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('receive_message', data);
  }

  // Send to everyone EXCEPT sender
  @SubscribeMessage('broadcast_message')
  handleBroadcast(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('receive_message', data);
  }
}
