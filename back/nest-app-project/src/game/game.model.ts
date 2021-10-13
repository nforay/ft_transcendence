import { Logger } from '@nestjs/common'
import { Socket } from 'socket.io'
import { UserEntity } from 'src/user/user.entity'
import { Repository } from 'typeorm'
import * as uuid from 'uuid'
import { CreateGameDto } from './dto/create-game.dto'
import { GameEntity } from './entities/game.entity'
import { GameGateway } from './game.gateway'

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

  createGame(player1Id: string, player2Id: string): Game {
    let alreadyExistingGame = this.getGameByPlayerId(player1Id);
    if (alreadyExistingGame)
      GameManager.instance.removeGame(alreadyExistingGame.id);
    alreadyExistingGame = this.getGameByPlayerId(player2Id);
    if (alreadyExistingGame)
      GameManager.instance.removeGame(alreadyExistingGame.id);

    const game = new Game(player1Id, player2Id)
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
    return this.games.find(game => game.player1.id === playerId || game.player2.id === playerId)
  }

  getGameBySocketId(socketId: string): Game {
    return this.games.find(game => game.player1.socketId === socketId || game.player2.socketId === socketId)
  }

  cancelGameByPlayerId(playerId: string): void {
    const game = this.getGameByPlayerId(playerId)
    if (game)
      game.cancelled = true
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

export class Player {
  id: string
  score: number = 0
  x: number
  y: number = 1000
  positionTime: number = new Date().getTime();
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
  cancelled = false;
  state = GameState.WAITING;

  player1: Player;
  player2: Player;

  ballX: number = 1000;
  ballY: number = Math.random() * (1750 - 250) + 250;
  ballRadius: number = 22
  ballAngle: number = 0;
  ballSpeed: number = 0;
  speedBoost: number = 0;
  collideLastFrame: boolean = false;

  ballLastX: number = 0;
  ballLastY: number = 0;

  lastUpdate: number = new Date().getTime();

  constructor(player1Id: string, player2Id: string) {
    this.player1 = new Player(player1Id, 100)
    this.player2 = new Player(player2Id, 1900)

    this.ballLastX = this.ballX;
    this.ballLastY = this.ballY;

    setTimeout(() => {
      if (!this.player1.socketId || !this.player2.socketId) {
        if (this.player1.socketId) {
          const socket = GameGateway.clients.find(client => client.id === this.player1.socketId)
          socket?.emit('gameCancelled', {})
          socket?.disconnect()
        }
        if (this.player2.socketId) {
          const socket = GameGateway.clients.find(client => client.id === this.player2.socketId)
          socket?.emit('gameCancelled', {})
          socket?.disconnect()
        }
      }
    }, 15000)
  }

  move(playerId: string, yPosition: number) : void {
    if (playerId === this.player1.id)
    {
      const time = new Date().getTime();
      this.player1.positionTime = time;
      const delta = (time - this.player1.positionTime) / 1000;
      yPosition = Math.min(Math.max(yPosition, this.player1.height / 2), 2000 - this.player1.height / 2);
      if (delta > 0.3)
        return;
      const dist = Math.abs(yPosition - this.player1.y);
      if (dist > this.player1.speed * delta + 50)
        return;
      this.player1.y = yPosition;
    }
    else if (playerId === this.player2.id)
    {
      const time = new Date().getTime();
      this.player2.positionTime = time;
      const delta = (time - this.player2.positionTime) / 1000;
      yPosition = Math.min(Math.max(yPosition, this.player2.height / 2), 2000 - this.player2.height / 2);
      if (delta > 0.3)
        return;
      const dist = Math.abs(yPosition - this.player2.y);
      if (dist > this.player2.speed * delta + 50)
        return;
      this.player2.y = yPosition;
    }
  }

  startIfBothConnected() {
    if (this.player1.socketId && this.player2.socketId) {
      GameGateway.clients.find(client => client.id === this.player1.socketId)?.emit('startSoon', { delay: 3 })
      GameGateway.clients.find(client => client.id === this.player2.socketId)?.emit('startSoon', { delay: 3 })
      setTimeout(() => { 
        this.state = GameState.IN_GAME;
        const dir = Math.random() < 0.5;
        if (dir)
          this.ballAngle = Math.PI - (Math.random() * (4*Math.PI/3 - 2*Math.PI/3) + 2*Math.PI/3);
        else
          this.ballAngle = (Math.random() * (4*Math.PI/3 - 2*Math.PI/3) + 2*Math.PI/3);
        this.ballSpeed = 1000;
        this.player1.speed = 1200;
        this.player2.speed = 1200;
        const time = new Date().getTime();
        this.player1.positionTime = time;
        this.player2.positionTime = time;
      }, 3000);
    }
  }

  update() : void {
    const time = new Date().getTime();
    if (this.state !== GameState.IN_GAME)
    {
      this.lastUpdate = time
      return
    }
    const delta = (time - this.lastUpdate) / 1000;
    const xDir = Math.cos(this.ballAngle);
    this.ballX += (this.ballSpeed + this.speedBoost) * xDir * delta;
    this.ballY += (this.ballSpeed + this.speedBoost) * Math.sin(this.ballAngle) * delta;

    if (this.ballX < 0) {
      this.player2.score++;
      if (this.player2.score >= 7) {
        this.end();
        return;
      }
      this.reset();
    }

    if (this.ballX > 2000) {
      this.player1.score++;
      if (this.player1.score >= 7) {
        this.end();
        return;
      }
      this.reset();
    }

    if (this.ballY < 0 || this.ballY > 2000)
      this.ballAngle = -this.ballAngle;

    const collide1 = this.collide(this.player1, xDir), collide2 = this.collide(this.player2, xDir);
    if ((xDir < 0 && collide1) || (xDir > 0 && collide2)) {
        const player = (xDir < 0 ? this.player1 : this.player2);
        const relativeIntersectY = player.y - this.ballY;
        const normalizedRelativeIntersectionY = (relativeIntersectY/(player.height/2));
        const bounceAngle = normalizedRelativeIntersectionY * (Math.PI/180 * 75);
        this.speedBoost = Math.abs(this.ballSpeed * (normalizedRelativeIntersectionY * 0.5));

        this.ballAngle = Math.atan2(this.ballSpeed*-Math.sin(bounceAngle), this.ballSpeed*Math.cos(bounceAngle));
        if (xDir > 0)
          this.ballAngle = Math.PI - this.ballAngle;
    }
    
    this.lastUpdate = time
    this.ballLastX = this.ballX;
    this.ballLastY = this.ballY;
  }

  async end(winnerId? : string) : Promise<void> {
    this.state = GameState.FINISHED;
    GameManager.instance.removeGame(this.id);

    const winner = { winner: (winnerId ? winnerId : (this.player1.score > this.player2.score ? this.player1.id : this.player2.id)) };
    GameGateway.clients.find(client => client.id === this.player1.socketId)?.emit('gameFinished', winner);
    GameGateway.clients.find(client => client.id === this.player2.socketId)?.emit('gameFinished', winner);

    const createGameDto = new CreateGameDto();
    createGameDto.player1Id = this.player1.id;
    createGameDto.player2Id = this.player2.id;
    createGameDto.player1Score = this.player1.score;
    createGameDto.player2Score = this.player2.score;
    createGameDto.player1Won = this.player1.score >= this.player2.score;
    const game = await GameManager.instance.gameRepository.create(createGameDto);
    if (!game)
      return;
    await GameManager.instance.gameRepository.save(game);
  }

  collide(player: Player, xDir: number) : boolean {
    const a = { x: this.ballX, y: this.ballY };
    const b = { x: this.ballLastX, y: this.ballLastY };
    const c = { x: (xDir < 0 ? player.x + player.width / 2 + this.ballRadius : player.x - player.width / 2 - this.ballRadius), y: player.y - player.height / 2};
    const d = { x: (xDir < 0 ? player.x + player.width / 2 + this.ballRadius : player.x - player.width / 2 - this.ballRadius), y: player.y + player.height / 2};
    const denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));
    const numerator1 = ((a.y - c.y) * (d.x - c.x)) - ((a.x - c.x) * (d.y - c.y));
    const numerator2 = ((a.y - c.y) * (b.x - a.x)) - ((a.x - c.x) * (b.y - a.y));
    
    if (denominator == 0)
      return numerator1 == 0 && numerator2 == 0;
        
    const r = numerator1 / denominator;
    const s = numerator2 / denominator;
    
    return (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
  }

  reset() : void {
    this.ballX = 1000;
    this.ballY = Math.random() * (1750 - 250) + 250;
    this.ballAngle = 0;
    this.ballSpeed = 0;
    this.player1.speed = 0;
    this.player2.speed = 0;
    this.player1.y = 1000;
    this.player2.y = 1000;
    this.speedBoost = 0;
    setTimeout(() => {
      const dir = Math.random() < 0.5;
      if (dir)
        this.ballAngle = Math.PI - (Math.random() * (4*Math.PI/3 - 2*Math.PI/3) + 2*Math.PI/3);
      else
        this.ballAngle = (Math.random() * (4*Math.PI/3 - 2*Math.PI/3) + 2*Math.PI/3);
      this.ballSpeed = 1000;
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
  }
}
