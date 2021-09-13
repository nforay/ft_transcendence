import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { HitGameModelDto } from "./dto/hit-game-model.dto";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { GameManager } from "./game.model";

@WebSocketGateway(4001, {
  cors: {
    credentials: true,
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    origin: 'http://localhost:8080'
  },
  allowEIO3: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection {

  logger: Logger = new Logger("GameGateway");

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`User connected !! ${client.id}`)
  }

  afterInit(server: Server) {
    this.logger.log(`Game websocket server is listening on ws://localhost:${process.env.WEBSOCKET_PORT}`);
  }

  @SubscribeMessage("move")
  move(@MessageBody() data: MoveGameModelDto) {
    const game = GameManager.instance.getGame(data.id);
    if (game) {
      game.move(data.playerId, data.direction, data.duration);
      return game;
    }
    throw new HttpException("Game not found", HttpStatus.NOT_FOUND);
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
