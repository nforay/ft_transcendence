import { Logger } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { MoveGameModelDto } from "./dto/move-game-model.dto";
import { GameManager, GameState, Player, Spectator } from "./game.model";
import * as jwt from 'jsonwebtoken'
import { Interval } from '@nestjs/schedule'
import { UserManager } from "../user/user.model";

@WebSocketGateway(4001, { cors: true })
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
      if (game.player1.id === decoded.playerId && !decoded.spectator) {
        game.player1.socketId = client.id;
        game.startIfBothConnected();
      }
      else if (game.player2.id === decoded.playerId && !decoded.spectator) {
        game.player2.socketId = client.id;
        game.startIfBothConnected();
      }
      else if (decoded.spectator === true) {
        game.spectators.push(new Spectator(decoded.playerId, client.id));
      }
    } catch (err) {
      return
    }
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

      const players = await UserManager.instance.userRepository.find({
        where: [{ id: game.player1.id }, { id: game.player2.id }]
      })

      let responseData = {
        game,
        isPlayer1: (decoded.playerId == game.player1.id || decoded.spectator === true),
        player1: (players[0].id === game.player1.id ? players[0] : players[1]).toResponseUser(),
        player2: (players[0].id === game.player1.id ? players[1] : players[0]).toResponseUser(),
      }

      return { event: 'init', data: responseData };
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

  @SubscribeMessage("usePowerup")
  async usePowerup(@MessageBody() data: { gameJwt: string }) {
    try {
      const decoded = await jwt.verify(data.gameJwt, process.env.JWT_SECRET);
      if (decoded.spectator === true)
        return null;
      let game = GameManager.instance.getGame(decoded.gameId);
      if (game && game.state === GameState.IN_GAME) {
        game.usePowerup(decoded.playerId);
        return game
      }
    } catch (err) {
      return null;
    }
  }
}
