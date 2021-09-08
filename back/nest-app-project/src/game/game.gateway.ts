import { HttpException, HttpStatus } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { CreateGameModelDto } from "./dto/create-game-model.dto";
import { HitGameModelDto } from "./dto/hit-game-model.dto";
import { JoinGameModelDto } from "./dto/join-game-model.dto";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { Game } from "./game.model";

@WebSocketGateway(+process.env.WEBSOCKET_PORT)
export class GameGateway {

  games: Game[] = [];

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
      game.move(data.playerId, data.yPosition);
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

}
