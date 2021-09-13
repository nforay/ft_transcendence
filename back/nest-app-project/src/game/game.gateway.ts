import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { CreateGameModelDto } from "./dto/create-game-model.dto";
import { HitGameModelDto } from "./dto/hit-game-model.dto";
import { JoinGameModelDto } from "./dto/join-game-model.dto";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { Game } from "./game.model";

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

  games: Game[] = [];
  logger: Logger = new Logger("GameGateway");

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`User connected !! ${client.id}`)
  }

  afterInit(server: Server) {
    this.logger.log(`Game websocket server is listening on ws://localhost:${process.env.WEBSOCKET_PORT}`);
  }

  @SubscribeMessage("create")
  create(@MessageBody() data: CreateGameModelDto) {
    const game = new Game(data.player1Id, data.player2Id);
    this.games.push(game);
    return game;
  }

  @SubscribeMessage("join")
  join(@MessageBody() data: JoinGameModelDto) {
    let game = this.games.find(game => game.id === data.id);
    if (game) {
      if (game.player2Id === null)
        game.player2Id = data.playerId;
      else
        throw new HttpException("Game is full", HttpStatus.FORBIDDEN);
      return game;
    }
    game = new Game(data.playerId, null);
    return game;
  }

  @SubscribeMessage("move")
  move(@MessageBody() data: MoveGameModelDto) {
    const game = this.games.find(game => game.id === data.id);
    if (game) {
      game.move(data.playerId, data.direction, data.duration);
      return game;
    }
    throw new HttpException("Game not found", HttpStatus.NOT_FOUND);
  }

  @SubscribeMessage("hit")
  hit(@MessageBody() data: HitGameModelDto) {
    const game = this.games.find(game => game.id === data.id);
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
