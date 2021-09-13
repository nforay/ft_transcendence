import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { HitGameModelDto } from "./dto/hit-game-model.dto";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { GameManager } from "./game.model";
import * as jwt from 'jsonwebtoken'
import { Interval } from '@nestjs/schedule'

@WebSocketGateway(4001, {
  cors: {
    credentials: true,
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    origin: 'http://localhost:8080'
  },
  allowEIO3: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  logger: Logger = new Logger("GameGateway");
  clients: Array<Socket> = []

  @Interval(50)
  sendGameData() : void {
    GameManager.instance.getGames().forEach(game => {
      this.clients.forEach(client => {
        client.emit('broadcast', { game })
      })
    })
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.clients.push(client);
    this.logger.log(`User connected !! ${client.id}`)
  }

  handleDisconnect(client: Socket, ...args: any[]) {
    this.clients.splice(this.clients.indexOf(client), 1);
    this.logger.log(`User connected !! ${client.id}`)
  }

  afterInit(server: Server) {
    this.logger.log(`Game websocket server is listening on ws://localhost:${process.env.WEBSOCKET_PORT}`);
  }

  @SubscribeMessage("init")
  async init(@MessageBody() data: { gameJwt: string }) : Promise<WsResponse> {
    try {
      const decoded = await jwt.verify(data.gameJwt, process.env.JWT_SECRET);
      const game = GameManager.instance.getGame(decoded.gameId);
      if (!game)
        return null;
      return { event: 'init', data: { game, isPlayer1: (decoded.playerId == game.player1.id) } };
    } catch (err) {
      return null;
    }
  }

  @SubscribeMessage("move")
  move(@MessageBody() data: MoveGameModelDto) {
    try {
      const decoded = jwt.verify(data.gameJwt, process.env.JWT_SECRET);
      let game = GameManager.instance.getGame(decoded.gameId);
      if (game) {
        game.move(decoded.playerId, data.yPosition);
        return game
      }
    } catch (err) {
      return null;
    }
  }

  @SubscribeMessage("hit")
  hit(@MessageBody() data: HitGameModelDto) {
    const game = GameManager.instance.getGame(data.id);
    if (game) {
      game.hit(data.playerId);
      return game;
    }
    throw new HttpException("Game not found", HttpStatus.NOT_FOUND);
  }

  @SubscribeMessage("echo")
  echo(@MessageBody() data: any) : WsResponse {
    this.logger.log(`Message from user : ${data}`);
    return { event: "echo", data: data };
  }
}
