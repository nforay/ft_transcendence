import { Logger } from '@nestjs/common'
import { Socket } from 'socket.io'
import { UserEntity } from '../user/user.entity'
import { Repository } from 'typeorm'
import * as uuid from 'uuid'
import { CreateGameDto } from './dto/create-game.dto'
import { GameEntity } from './entities/game.entity'
import { GameGateway } from './game.gateway'
import { UserManager, UserStatus } from '../user/user.model'
import { ResponseGame } from './dto/response-game.dto'

export class GameManager {
  public static instance: GameManager = new GameManager()
  public gameRepository: Repository<GameEntity>
  private games: Game[] = []

  constructor() {
    if (GameManager.instance) {
      throw new Error('Error: Instantiation failed: Use GameManager.instance instead of new.')
    }
    GameManager.instance = this
  }

  createGame(player1Id: string, player2Id: string, updateStats: boolean = true): Game {
    let alreadyExistingGame = this.getGameByPlayerId(player1Id);
    if (alreadyExistingGame)
      GameManager.instance.removeGame(alreadyExistingGame.id);
    alreadyExistingGame = this.getGameByPlayerId(player2Id);
    if (alreadyExistingGame)
      GameManager.instance.removeGame(alreadyExistingGame.id);

    const game = new Game(player1Id, player2Id, updateStats)
    this.games.push(game)
    return game
  }

  getGame(gameId: string): Game {
    return this.games.find(game => game.id === gameId)
  }

  getGames(): Game[] {
    return this.games
  }

  getGameByPlayerId(playerId: string): Game {
    return this.games.find(game => game.player1.id === playerId || game.player2.id === playerId || game.spectators.find(spectator => spectator.id === playerId))
  }

  getGameBySocketId(socketId: string): Game {
    return this.games.find(game => game.player1.socketId === socketId || game.player2.socketId === socketId || game.spectators.find(spectator => spectator.socketId === socketId))
  }

  removeGame(gameId: string) {
    const game = this.getGame(gameId)
    if (game)
      GameManager.instance.games.splice(GameManager.instance.games.indexOf(game), 1)
  }
}

export enum GameState {
  WAITING,
  IN_GAME,
  FINISHED,
}

export class Spectator {
  id: string;
  socketId: string;

  constructor(id: string, socketId: string) {
    this.id = id
    this.socketId = socketId;
  }
}

export class Player {
  id: string
  score: number = 0
  x: number
  y: number = 1000
  positionTime: number = new Date().getTime();
  lastPacketId = -1;
  width: number = 30
  height: number = 250
  socketId: string = null
  speed: number = 0

  constructor(id: string, x: number) {
    this.id = id
    this.x = x;
  }
}

// Assume 2000x2000 canvas
// Speed in units/second
export class Game {
  id: string = uuid.v4();
  state = GameState.WAITING;

  player1: Player;
  player2: Player;

  ballX: number = 1000;
  ballY: number = Math.random() * (1750 - 250) + 250;
  ballRadius: number = 22
  ballXSpeed: number = 0;
  ballYSpeed: number = 0;
  collideLastFrame: boolean = false;
  speedBoost = 0;

  ballLastX: number = 0;
  ballLastY: number = 0;

  engage = true

  lastUpdate: number = new Date().getTime();
  updateId = 0;

  updateStats: boolean;

  spectators: Spectator[] = []

  constructor(player1Id: string, player2Id: string, updateStats: boolean) {
    this.player1 = new Player(player1Id, 100)
    this.player2 = new Player(player2Id, 1900)

    this.ballLastX = this.ballX;
    this.ballLastY = this.ballY;

    this.updateStats = updateStats

    setTimeout(() => {
      if (!this.player1.socketId || !this.player2.socketId) {
        if (this.player1.socketId) {
          const socket = GameGateway.clients.find(client => client.id === this.player1.socketId)
          socket?.emit('gameCanceled', {})
          socket?.disconnect()
          GameGateway.clients.splice(GameGateway.clients.indexOf(socket), 1);
        }
        if (this.player2.socketId) {
          const socket = GameGateway.clients.find(client => client.id === this.player2.socketId)
          socket?.emit('gameCanceled', {})
          socket?.disconnect()
          GameGateway.clients.splice(GameGateway.clients.indexOf(socket), 1);
        }
        this.spectators.forEach(spectator => {
          const socket = GameGateway.clients.find(client => client.id === spectator.socketId)
          socket?.emit('gameCanceled', {})
          socket?.disconnect()
          GameGateway.clients.splice(GameGateway.clients.indexOf(socket), 1);
        });

        this.state = GameState.FINISHED;
        GameManager.instance.removeGame(this.id)

      }
    }, 15000)
  }

  move(playerId: string, yPosition: number, packetId: number) : void {
    if (playerId === this.player1.id)
    {
      if (packetId <= this.player1.lastPacketId)
        return;
      this.player1.lastPacketId = packetId;
      const time = new Date().getTime();
      this.player1.positionTime = time;
      const delta = (time - this.player1.positionTime) / 1000;
      yPosition = Math.min(Math.max(yPosition, this.player1.height / 2), 2000 - this.player1.height / 2);
      if (delta > 0.3)
        return;
      const dist = Math.abs(yPosition - this.player1.y);
      if (dist > this.player1.speed * delta + 200)
        return;
      this.player1.y = yPosition;
    }
    else if (playerId === this.player2.id)
    {
      if (packetId <= this.player2.lastPacketId)
        return;
      this.player2.lastPacketId = packetId;
      const time = new Date().getTime();
      this.player2.positionTime = time;
      const delta = (time - this.player2.positionTime) / 1000;
      yPosition = Math.min(Math.max(yPosition, this.player2.height / 2), 2000 - this.player2.height / 2);
      if (delta > 0.3)
        return;
      const dist = Math.abs(yPosition - this.player2.y);
      if (dist > this.player2.speed * delta + 200)
        return;
      this.player2.y = yPosition;
    }
  }

  startIfBothConnected() {
    if (this.player1.socketId && this.player2.socketId) {
      GameGateway.clients.find(client => client.id === this.player1.socketId)?.emit('startSoon', { delay: 3 })
      GameGateway.clients.find(client => client.id === this.player2.socketId)?.emit('startSoon', { delay: 3 })
      setTimeout(() => {
        if (this.state == GameState.FINISHED)
          return;
        this.state = GameState.IN_GAME;
        this.ballXSpeed = (Math.random() < 0.5 ? -1 : 1) * 1000;
        this.ballYSpeed = Math.random() * (700 - (-700)) + -700;
        this.player1.speed = 1200;
        this.player2.speed = 1200;
        const time = new Date().getTime();
        this.player1.positionTime = time;
        this.player2.positionTime = time;
        if (UserManager.instance.onlineUsersStatus.has(this.player1.id)) {
          UserManager.instance.onlineUsersStatus.get(this.player1.id).status = 'ingame';
          UserManager.instance.onlineUsersStatus.get(this.player1.id).lastRequestTime = new Date().getTime();
        }
        if (UserManager.instance.onlineUsersStatus.has(this.player2.id)) {
          UserManager.instance.onlineUsersStatus.get(this.player2.id).status = 'ingame';
          UserManager.instance.onlineUsersStatus.get(this.player2.id).lastRequestTime = new Date().getTime();
        }
      }, 3000);
    }
  }

  update() : void {
    this.updateId++;
    const time = new Date().getTime();
    if (this.state !== GameState.IN_GAME)
    {
      this.lastUpdate = time
      return
    }
    const delta = (time - this.lastUpdate) / 1000;
    const xDir = (this.ballXSpeed > 0 ? 1 : -1);
    const yDir = (this.ballYSpeed > 0 ? 1 : -1);
    this.ballX += (this.ballXSpeed + (xDir < 0 ? -this.speedBoost : this.speedBoost)) * delta * (this.engage ? 0.5 : 1);
    this.ballY += this.ballYSpeed * delta;

    if (this.ballX < 0) {
      this.player2.score++;
      if (this.player2.score >= 7)
        this.end();
      else
        this.reset();
      this.lastUpdate = time;
      return;
    }

    if (this.ballX > 2000) {
      this.player1.score++;
      if (this.player1.score >= 7)
        this.end();
      else
        this.reset();
      this.lastUpdate = time;
      return;
    }

    if (this.ballY < 0 || this.ballY > 2000) {
      this.ballYSpeed *= -1;
      this.ballY = (this.ballY < 0 ? 0 : 2000);
    }

    const collide1 = this.collide(this.player1, xDir), collide2 = this.collide(this.player2, xDir);
    if ((xDir < 0 && collide1) || (xDir > 0 && collide2)) {
        this.engage = false
        const player = (xDir < 0 ? this.player1 : this.player2);
        const relativeIntersectY = player.y - this.ballY;
        const normalizedRelativeIntersectionY = (relativeIntersectY/(player.height/2));
        const bounceX = normalizedRelativeIntersectionY * (500);
        const bounceY = normalizedRelativeIntersectionY * (-1500);
        this.speedBoost = Math.abs(bounceX);
        this.ballYSpeed = bounceY;
        this.ballXSpeed *= -1;
    }
    
    this.lastUpdate = time;
    this.ballLastX = this.ballX;
    this.ballLastY = this.ballY;
  }

  async end(winnerId? : string) : Promise<void> {
    this.state = GameState.FINISHED;
    GameManager.instance.removeGame(this.id);

    const winner = { winner: (winnerId ? winnerId : (this.player1.score > this.player2.score ? this.player1.id : this.player2.id)) };
    GameGateway.clients.find(client => client.id === this.player1.socketId)?.emit('gameFinished', winner);
    GameGateway.clients.find(client => client.id === this.player2.socketId)?.emit('gameFinished', winner);

    this.spectators.forEach(spectator => {
      const socket = GameGateway.clients.find(client => client.id === spectator.socketId)
      socket?.emit('gameFinished', winner)
    });

    const createGameDto = new CreateGameDto();
    createGameDto.player1Id = this.player1.id;
    createGameDto.player2Id = this.player2.id;
    createGameDto.player1Score = this.player1.score;
    createGameDto.player2Score = this.player2.score;
    createGameDto.player1Won = (winnerId ? winnerId === this.player1.id : this.player1.score >= this.player2.score);
    const game = await GameManager.instance.gameRepository.create(createGameDto);
    if (!game)
      return;

    const winnerUser = await UserManager.instance.userRepository.findOne({where: { id: winner.winner }});
    const loserUser = await UserManager.instance.userRepository.findOne({where: { id: (winner.winner === this.player1.id ? this.player2.id : this.player1.id) }});
    if (!winnerUser && !loserUser) {
      return;
    }
    if (this.updateStats) {
      winnerUser.win += 1;
      loserUser.lose += 1;
      winnerUser.xp += 50;
      loserUser.xp += 30;
      this.updateEloRatings(winnerUser, loserUser);
    }


    if (UserManager.instance.onlineUsersStatus.has(this.player1.id)) {
      UserManager.instance.onlineUsersStatus.get(this.player1.id).status = 'online';
      UserManager.instance.onlineUsersStatus.get(this.player1.id).lastRequestTime = new Date().getTime();
    }
    if (UserManager.instance.onlineUsersStatus.has(this.player2.id)) {
      UserManager.instance.onlineUsersStatus.get(this.player2.id).status = 'online';
      UserManager.instance.onlineUsersStatus.get(this.player2.id).lastRequestTime = new Date().getTime();
    }

    await GameManager.instance.gameRepository.save(game);
  }

  updateEloRatings(winner, loser) : void {
    const winnerTransformedRating = Math.pow(10, winner.elo / 400);
    const loserTransformedRating = Math.pow(10, loser.elo / 400);

    const expectedWinner = winnerTransformedRating / (winnerTransformedRating + loserTransformedRating);
    const expectedLoser = loserTransformedRating / (winnerTransformedRating + loserTransformedRating);

    const scoreWinner = 1;
    const scoreLoser = 0;

    const k = 32;

    winner.elo = Math.max(Math.round(winner.elo + k * (scoreWinner - expectedWinner)), 100);
    loser.elo = Math.max(Math.round(loser.elo + k * (scoreLoser - expectedLoser)), 100);

    UserManager.instance.userRepository.save(winner);
    UserManager.instance.userRepository.save(loser);
  }

  collide(player: Player, xDir: number) : boolean {
    /*const a = { x: this.ballX, y: this.ballY };
    const b = { x: this.ballLastX, y: this.ballLastY };*/
    const c = { x: this.ballX, y: this.ballY - this.ballRadius };
    const d = { x: this.ballLastX, y: this.ballLastY - this.ballRadius };
    const e = { x: this.ballX, y: this.ballY + this.ballRadius};
    const f = { x: this.ballLastX, y: this.ballLastY + this.ballRadius};
    const rect = {
      left: (xDir < 0 ? player.x : player.x - player.width / 2 - this.ballRadius),
      right: (xDir < 0 ? player.x + player.width / 2 + this.ballRadius : player.x),
      bottom: player.y + player.height / 2,
      top: player.y - player.height / 2
    };
    return this.lineLineCollide(c, d, { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top })
        || this.lineLineCollide(c, d, { x: rect.left, y: rect.bottom }, { x: rect.right, y: rect.bottom })
        || this.lineLineCollide(c, d, { x: rect.left, y: rect.top }, { x: rect.left, y: rect.bottom })
        || this.lineLineCollide(c, d, { x: rect.right, y: rect.top }, { x: rect.right, y: rect.bottom })
        || this.lineLineCollide(e, f, { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top })
        || this.lineLineCollide(e, f, { x: rect.left, y: rect.bottom }, { x: rect.right, y: rect.bottom })
        || this.lineLineCollide(e, f, { x: rect.left, y: rect.top }, { x: rect.left, y: rect.bottom })
        || this.lineLineCollide(e, f, { x: rect.right, y: rect.top }, { x: rect.right, y: rect.bottom })
  }

  lineLineCollide(a, b, c, d) {
    const denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));
    const numerator1 = ((a.y - c.y) * (d.x - c.x)) - ((a.x - c.x) * (d.y - c.y));
    const numerator2 = ((a.y - c.y) * (b.x - a.x)) - ((a.x - c.x) * (b.y - a.y));
    
    if (denominator == 0)
      return numerator1 == 0 && numerator2 == 0;
    
    const r = numerator1 / denominator;
    const s = numerator2 / denominator;
    return ((r >= 0 && r <= 1) && (s >= 0 && s <= 1));
  }

  reset() : void {
    this.ballX = 1000;
    this.ballY = Math.random() * (1750 - 250) + 250;
    this.ballLastX = this.ballX
    this.ballLastY = this.ballY
    this.ballXSpeed = 0;
    this.ballYSpeed = 0;
    this.player1.speed = 0;
    this.player2.speed = 0;
    this.player1.y = 1000;
    this.player2.y = 1000;
    this.speedBoost = 0;
    this.engage = true;
    setTimeout(() => {
      this.ballXSpeed = (Math.random() < 0.5 ? -1 : 1) * 1000;
      this.ballYSpeed = Math.random() * (700 - (-700)) + -700;
      this.player1.speed = 1200;
      this.player2.speed = 1200;
      const time = new Date().getTime();
      this.player1.positionTime = time;
      this.player2.positionTime = time;
    }, 3000)
  }

  disconnect(socketId : string) : void {
    const winner = this.player1.socketId === socketId ? this.player2 : this.player1;
    this.end(winner.id);
    const winnerSocket = GameGateway.clients.find(c => c.id === winner.socketId);
    winnerSocket.disconnect();
    GameGateway.clients.splice(GameGateway.clients.indexOf(winnerSocket), 1);
  }

  cancel(socketId : string) : void {
    this.state = GameState.FINISHED;

    this.spectators.forEach(spectator => {
      const socket = GameGateway.clients.find(client => client.id === spectator.socketId)
      socket?.emit('gameCanceled', {})
      GameGateway.clients.splice(GameGateway.clients.indexOf(socket), 1);
    });

    GameManager.instance.removeGame(this.id);
    const opponent = this.player1.socketId === socketId ? this.player2 : this.player1;
    const opponentSocket = GameGateway.clients.find(c => c.id === opponent.socketId);
    if (opponentSocket)
    {
      opponentSocket.emit('gameCanceled');
      opponentSocket.disconnect();
    }
    GameGateway.clients.splice(GameGateway.clients.indexOf(opponentSocket), 1);


    if (UserManager.instance.onlineUsersStatus.has(this.player1.id)) {
      UserManager.instance.onlineUsersStatus.get(this.player1.id).status = 'online';
      UserManager.instance.onlineUsersStatus.get(this.player1.id).lastRequestTime = new Date().getTime();
    }
    if (UserManager.instance.onlineUsersStatus.has(this.player2.id)) {
      UserManager.instance.onlineUsersStatus.get(this.player2.id).status = 'online';
      UserManager.instance.onlineUsersStatus.get(this.player2.id).lastRequestTime = new Date().getTime();
    }
  }

  toResponseGame() : Partial<ResponseGame> {
    return {
      id: this.id,
      player1Id: this.player1.id,
      player2Id: this.player2.id,
      player1Score: this.player1.score,
      player2Score: this.player2.score,
    }
  }
}
