import { Socket } from 'socket.io'
import * as uuid from 'uuid'
import { GameGateway } from './game.gateway'

export class GameManager {
  public static instance: GameManager = new GameManager()
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
  width: number = 75
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
  ballY: number = 1000;
  ballAngle: number = 0;
  ballSpeed: number = 450;

  constructor(player1Id: string, player2Id: string) {
    this.player1 = new Player(player1Id, 100)
    this.player2 = new Player(player2Id, 1900)

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
      this.player1.y = yPosition;
    else if (playerId === this.player2.id)
      this.player2.y = yPosition;
  }

  hit(playerId: string) : void {
    if (playerId === this.player1.id)
      this.ballAngle = this.getHitAngle(this.player1.x, this.player1.y);
    else if (playerId === this.player2.id)
      this.ballAngle = this.getHitAngle(this.player2.x, this.player2.y);
  }

  getHitAngle(xPosition: number, yPosition: number) : number {
    return Math.atan2(yPosition - this.ballY, xPosition - this.ballX);
  }

  startIfBothConnected() {
    if (this.player1.socketId && this.player2.socketId) {
      GameGateway.clients.find(client => client.id === this.player1.socketId)?.emit('startSoon', { delay: 3 })
      GameGateway.clients.find(client => client.id === this.player2.socketId)?.emit('startSoon', { delay: 3 })
      setTimeout(() => { 
        this.state = GameState.IN_GAME;
        this.ballSpeed = 450;
        this.player1.speed = 550;
        this.player2.speed = 550;
      }, 3000);
    }
  }

  update() : void {
    this.ballX += this.ballSpeed;
    this.ballY += this.ballSpeed * Math.sin(this.ballAngle);

    if (this.ballX < 0) {
      this.player2.score++;
      this.reset();
    }

    if (this.ballX > 2000) {
      this.player1.score++;
      this.reset();
    }

    if (this.ballY < 0 || this.ballY > 2000)
      this.ballAngle = Math.PI - this.ballAngle;
  }

  reset() : void {
    this.ballX = 1000;
    this.ballY = 1000;
    this.ballAngle = 0;
    this.ballSpeed = 0;
  }
}
