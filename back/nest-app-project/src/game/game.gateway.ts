import { Logger } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { GameManager, GameState, Player, Spectator } from "./game.model";
import * as jwt from 'jsonwebtoken'
import { Interval } from '@nestjs/schedule'

@WebSocketGateway(4001, {
  cors: {
    credentials: true,
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    origin: `http://${process.env.DOMAIN}:${process.env.VUE_PORT}`
  },
  allowEIO3: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  public static clients: Array<Socket> = []
  logger: Logger = new Logger("GameGateway");

  @Interval(12)
  sendGameData() : void {
    GameManager.instance.getGames().forEach(game => {
      game.update();
      const time = new Date().getTime();
      if (game.updateId % 2 === 0) {
        GameGateway.clients.find(client => client.id === game.player1.socketId)?.emit('broadcast', { game, time });
        GameGateway.clients.find(client => client.id === game.player2.socketId)?.emit('broadcast', { game, time });
        game.spectators.forEach(spectator => {
          GameGateway.clients.find(client => client.id === spectator.socketId)?.emit('broadcast', { game, time });
        })
      }
    })
  }

  async handleConnection(client: Socket, ...args: any[]) {
    GameGateway.clients.push(client);
    try {
      const decoded = await jwt.verify(client.handshake.query.gameJwt, process.env.JWT_SECRET);
      let game = GameManager.instance.getGame(decoded.gameId)
      if (!game)
        return
      if (game.player1.id === decoded.playerId) {
        game.player1.socketId = client.id;
        game.startIfBothConnected();
      }
      else if (game.player2.id === decoded.playerId) {
        game.player2.socketId = client.id;
        game.startIfBothConnected();
      }
      else if (decoded.spectator === true) {
        game.spectators.push(new Spectator(decoded.playerId, client.id));
      }
    } catch (err) {
      return
    }
    this.logger.log(`User connected !! ${client.id}`)
  }

  handleDisconnect(client: Socket, ...args: any[]) {
    const game = GameManager.instance.getGameBySocketId(client.id);
    if (game)
    {
      if (game.spectators.find(spectator => spectator.socketId === client.id))
        game.spectators = game.spectators.filter(spectator => spectator.socketId !== client.id);
      else if (game.state !== GameState.IN_GAME)
        game.cancel(client.id);
      else
        game.disconnect(client.id);
    }
    GameGateway.clients.splice(GameGateway.clients.indexOf(client), 1);
    this.logger.log(`User disconnected !! ${client.id}`)
  }

  afterInit(server: Server) {
    this.logger.log(`Game websocket server is listening on ws://localhost:${process.env.WEBSOCKET_PORT}`);
  }

  @SubscribeMessage("init")
  async init(@MessageBody() data: { gameJwt: string }) : Promise<WsResponse> {
    try {
      const decoded = await jwt.verify(data.gameJwt, process.env.JWT_SECRET);
      let game = GameManager.instance.getGame(decoded.gameId);
      if (!game)
        return null;
      return { event: 'init', data: { game, isPlayer1: (decoded.playerId == game.player1.id || decoded.spectator === true) } };
    } catch (err) {
      return null;
    }
  }

  @SubscribeMessage("move")
  async move(@MessageBody() data: MoveGameModelDto) {
    try {
      const decoded = await jwt.verify(data.gameJwt, process.env.JWT_SECRET);
      if (decoded.spectator === true)
        return null;
      let game = GameManager.instance.getGame(decoded.gameId);
      if (game && game.state === GameState.IN_GAME) {
        game.move(decoded.playerId, data.yPosition, data.packetId);
        return game
      }
    } catch (err) {
      return null;
    }
  }
}
