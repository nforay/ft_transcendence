import { ChatService } from './chat.service';
import { AcceptMessage, ChatMessage, DeclineMessage, RequestMessage } from './chat.dto';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'
import { UserManager } from '../user/user.model';
import { ChallengeManager } from '../challenge/challenge.model';
import { GameManager } from '../game/game.model';
import { GameSettingsDto } from '../matchmaking/matchmaking.dto';

@WebSocketGateway(8082, {
	cors: {
		credentials: true,
		methods: ["GET", "POST"],
		transports: ['websocket', 'polling'],
		// origin: `http://${process.env.DOMAIN}:${process.env.VUE_PORT}`
		origin: `http://localhost:8080`
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

  @SubscribeMessage('sendChallengeRequest')
  async sendChallengeRequest(@MessageBody() request: RequestMessage, @ConnectedSocket() client: Socket) {
    let user = undefined;
    try {
      const decoded = await jwt.verify(request.token, process.env.JWT_SECRET);
      user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user)
      {
        client.disconnect(true);
        return;
      }
    } catch (err) {
      client.disconnect(true);
      return;
    }
    const target = await UserManager.instance.userRepository.findOne({ name: request.to });
    if (!target || target.id === user.id)
    {
      client.emit('sendChallengeResponse', { success: false });
      return;
    }
    if (GameManager.instance.getGameByPlayerId(user.id) || GameManager.instance.getGameByPlayerId(target.id))
    {
      client.emit('sendChallengeResponse', { success: false });
      return;
    }
    const targetSocket = this.chatService.users.get(target.id);
    if (!targetSocket) {
      client.emit('sendChallengeResponse', { success: false });
      return;
    }
    if (ChallengeManager.instance.pendingRequests.has(user.id) && ChallengeManager.instance.pendingRequests.get(user.id).to === target.id) {
      client.emit('sendChallengeResponse', { success: false });
      return;
    }
    ChallengeManager.instance.addChallenge(user.id, target.id, new GameSettingsDto(request.powerup, request.map));
    const challenge = ChallengeManager.instance.pendingRequests.get(user.id)
    Logger.log('DEBUG: challenge settings: ' + request.powerup + ' ' + request.map, "Chat");
    client.emit('sendChallengeResponse', { from: user.name, to: target.name, success: true });
    targetSocket.sock.emit('recieveChallengeRequest', { from: user.name, to: target.name, expiresIn: challenge.expireDate - new Date().getTime(), powerup: request.powerup !== 'no_powerup', map: request.map });
  }

	handleConnection(client: Socket, ...args: any[]) {
		Logger.log('User connected', "Chat");
	}

  @SubscribeMessage('declineChallengeRequest')
  async declineChallengeRequest(@MessageBody() request: DeclineMessage, @ConnectedSocket() client: Socket) {
    let user = undefined;
    try {
      const decoded = await jwt.verify(request.token, process.env.JWT_SECRET);
      user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user)
      {
        client.disconnect(true);
        return;
      }
    } catch (err) {
      client.disconnect(true);
      return;
    }
    const sender = await UserManager.instance.userRepository.findOne({ name: request.sender });
    if (!sender || sender.id === user.id)
      return;
    
    ChallengeManager.instance.rejectRequest(sender.id, user.id);
  }

  @SubscribeMessage('acceptChallengeRequest')
  async acceptChallengeRequest(@MessageBody() request: AcceptMessage, @ConnectedSocket() client: Socket) {
    let user = undefined;
    try {
      const decoded = await jwt.verify(request.token, process.env.JWT_SECRET);
      user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user)
      {
        client.disconnect(true);
        return;
      }
    } catch (err) {
      client.disconnect(true);
      return;
    }
    const sender = await UserManager.instance.userRepository.findOne({ name: request.sender });
    if (!sender || sender.id === user.id)
      return;
    if (!ChallengeManager.instance.pendingRequests.has(sender.id) || ChallengeManager.instance.pendingRequests.get(sender.id).to !== user.id)
    {
      client.emit('challengeGameStarting', { success: false });
      return
    }

    const senderSocket = this.chatService.users.get(sender.id);
    if (!senderSocket) {
      client.emit('challengeGameStarting', { success: false });
      return;
    }
    if (ChallengeManager.instance.pendingRequests.has(user.id) && ChallengeManager.instance.pendingRequests.get(user.id).to === sender.id) {
      client.emit('challengeGameStarting', { success: false });
      return;
    }
    const challenge = ChallengeManager.instance.pendingRequests.get(sender.id);
    if (challenge.settings.powerup === 'no_powerup' || request.powerup === 'no_powerup' && challenge.settings.powerup !== request.powerup) {
      client.emit('challengeGameStarting', { success: false });
      return;
    }
    const game = GameManager.instance.createGame(user.id, sender.id, request.powerup, challenge.settings.powerup, challenge.settings.map, false);
    const player1Jwt = await jwt.sign({ gameId: game.id, playerId: user.id }, process.env.JWT_SECRET, {expiresIn: '1y'});
    const player2Jwt = await jwt.sign({ gameId: game.id, playerId: sender.id }, process.env.JWT_SECRET, {expiresIn: '1y'});
    client.emit('challengeGameStarting', { success: true, gameId: game.id, gameJwt: player1Jwt });
    senderSocket.sock.emit('challengeGameStarting', { success: true, gameId: game.id, gameJwt: player2Jwt });
    ChallengeManager.instance.clearAllChallenges(user.id);
    ChallengeManager.instance.clearAllChallenges(sender.id);
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
