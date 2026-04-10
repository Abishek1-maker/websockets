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

  // Store connected users: { socketId: username }
  private users: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`✅ Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.users.get(client.id);
    this.users.delete(client.id);
    console.log(`❌ Disconnected: ${username}`);

    // Tell everyone this user left
    this.server.emit('user_left', {
      message: `${username} has left the chat`,
    });
  }

  // Step 1: Client sets their username
  @SubscribeMessage('set_username')
  handleSetUsername(
    @MessageBody() username: string,
    @ConnectedSocket() client: Socket,
  ) {
    // Save username against their socket id
    this.users.set(client.id, username);
    console.log(`👤 Username set: ${username}`);

    // Confirm back to the client
    client.emit('username_confirmed', {
      message: `Welcome ${username}!`,
    });

    // Tell everyone a new user joined
    this.server.emit('user_joined', {
      message: `${username} has joined the chat`,
    });
  }

  // Step 2: Client sends a message
  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    const username = this.users.get(client.id) ?? 'Anonymous';

    console.log(`📨 ${username}: ${data}`);

    // Send message with username to EVERYONE
    this.server.emit('receive_message', {
      username,
      message: data,
      time: new Date().toLocaleTimeString(),
    });
  }
}
