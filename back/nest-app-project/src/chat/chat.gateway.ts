import { ChatService } from './chat.service';
import { ChatMessage } from './chat.dto';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'
import { UserManager } from '../user/user.model';

@WebSocketGateway(8082, {
	cors: {
		credentials: true,
		methods: ["GET", "POST"],
		transports: ['websocket', 'polling'],
		origin: 'http://localhost:8080'
	},
	allowEIO3: true
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

	@WebSocketServer()
	server: Server;

	constructor(private chatService: ChatService) {
	}

	@SubscribeMessage('send_message')
	async recvMessage(@MessageBody() msg: ChatMessage, @ConnectedSocket() client: Socket) {
    try {
      const decoded = await jwt.verify(msg.token, process.env.JWT_SECRET);
      const user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user)
      {
        client.disconnect(true);
        return;
      }
      await this.chatService.execute(user.name, msg.msg, client).catch(() => {
      });
    }
    catch (err) {
      client.disconnect(true);
      return;
    }
	}

	@SubscribeMessage('init')
	async idClient(@MessageBody() token: string, @ConnectedSocket() client: Socket) {
    try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user)
      {
        client.disconnect(true);
        return;
      }
      await this.chatService.addClient(user.id, client)
    } catch (err) {
      client.disconnect(true);
    }
	}

	handleConnection(client: Socket, ...args: any[]) {
		Logger.log('User connected', "Chat");
	}

	async handleDisconnect(client: Socket) {
		try {
      this.chatService.rmClient(client)
      Logger.log('User disconnected', "Chat");
    } catch (err) {
			Logger.log("this.chatService.rmClient() uncatched rejected promise")
    }
  }

	async afterInit(server: Server) {
		Logger.log('Socket is alive', "Chat")
	}
}
