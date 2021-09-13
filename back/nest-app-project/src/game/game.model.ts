import * as uuid from 'uuid'

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
  paddleSpeed: number = 550;

  constructor(player1Id: string, player2Id: string) {
    this.player1 = new Player(player1Id, 100)
    this.player2 = new Player(player2Id, 1900)
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

  update() : void {
    this.ballX += this.ballSpeed;
    this.ballY += this.ballSpeed * Math.sin(this.ballAngle);

    if (this.ballX < 0) {
      this.player2.score++;
      this.reset();
    }

    if (this.ballX > 800) {
      this.player1.score++;
      this.reset();
    }

    if (this.ballY < 0 || this.ballY > 600)
      this.ballAngle = Math.PI - this.ballAngle;
  }

  reset() : void {
    this.ballX = 400;
    this.ballY = 300;
    this.ballAngle = 0;
    this.ballSpeed = 0;
  }
}
