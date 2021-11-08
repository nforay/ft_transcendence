/*
https://docs.nestjs.com/websockets/gateways#gateways
*/

import { ChatService } from './chat.service';
import { ChatMessage } from './chat.dto';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'

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
    recvMessage(@MessageBody() msg: ChatMessage, @ConnectedSocket() client: Socket) {
		console.log('Message received ' + msg.name + " " + msg.msg);
		this.chatService.execute(msg, client)
	}

	@SubscribeMessage('identification')
	idClient(@MessageBody() name: string, @ConnectedSocket() client: Socket) {
		this.chatService.addClient(name, client);
	}

    handleConnection(client: Socket, ...args: any[]) {
        console.log('User connected');
    }

    handleDisconnect(client: Socket) {
		this.chatService.rmClient(client);
        console.log('User disconnected');
    }

    afterInit(server: Server) {
        console.log('Socket is live')
    }
}
