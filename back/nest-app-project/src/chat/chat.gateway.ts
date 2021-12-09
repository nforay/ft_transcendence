import { ChatService } from './chat.service';
import { ChatMessage } from './chat.dto';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
		console.log('Message received ' + msg.name + " " + msg.msg);
		await this.chatService.execute(msg, client).catch(() => (
			console.log("this.chatService.execute() uncatched rejected promise")
		));
	}

	@SubscribeMessage('identification')
	async idClient(@MessageBody() name: string, @ConnectedSocket() client: Socket) {
		await this.chatService.addClient(name, client).catch(() => (
			console.log("this.chatService.addClient() uncatched rejected promise")
		));
	}

	handleConnection(client: Socket, ...args: any[]) {
		console.log('User connected');
	}

	async handleDisconnect(client: Socket) {
		await this.chatService.rmClient(client).catch(() => (
			console.log("this.chatService.rmClient() uncatched rejected promise")
		));
		console.log('User disconnected');
	}

	async afterInit(server: Server) {
		await this.chatService.init();
		console.log('Socket is live')
	}
}
