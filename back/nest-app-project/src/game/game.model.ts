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
  gameJWT: string;
  id: string
  score: number = 0
  x: number = 0
  y: number = 0

  constructor(id: string) {
    this.id = id
  }
}

export class Game {
  id: string = uuid.v4();
  cancelled = false;
  state = GameState.WAITING;

  player1: Player;
  player2: Player;

  ballX: number = 0;
  ballY: number = 0;
  ballAngle: number = 0;
  ballSpeed: number = 0;
  paddleSpeed: number = 0;

  constructor(player1Id: string, player2Id: string) {
    this.player1 = new Player(player1Id)
    this.player2 = new Player(player2Id)
  }

  setPlayerJwt(playerId: string, jwt: string) {
    if (playerId === this.player1.id)
      this.player1.gameJWT = jwt;
    else if (playerId === this.player2.id)
      this.player2.gameJWT = jwt;
  }

  move(playerId: string, direction: string, duration: number) : void {
    let dir = 0;

    if (direction === 'up')
      dir = -this.paddleSpeed
    else if (direction === 'down')
      dir = this.paddleSpeed;
    if (playerId === this.player1.id)
      this.player1.y += dir;
    else if (playerId === this.player2.id)
      this.player2.y += dir;
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
