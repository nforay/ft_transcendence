import * as uuid from 'uuid'

export class Game {
  id: string = uuid.v4();
  player1Id: string;
  player2Id: string;
  player1Score: number = 0;
  player2Score: number = 0;
  player1Y: number = 0;
  player2Y: number = 0;
  player1X: number = 0;
  player2X: number = 0;
  ballX: number = 0;
  ballY: number = 0;
  ballAngle: number = 0;
  ballSpeed: number = 0;

  constructor(player1Id: string, player2Id: string) {
    this.player1Id = player1Id;
    this.player2Id = player2Id;
  }

  move(playerId: string, position: number) : void {
    if (playerId === this.player1Id)
      this.player1Y = position;
    else if (playerId === this.player2Id)
      this.player2Y = position;
  }

  hit(playerId: string) : void {
    if (playerId === this.player1Id)
      this.ballAngle = this.getHitAngle(this.player1X, this.player1Y);
    else if (playerId === this.player2Id)
      this.ballAngle = this.getHitAngle(this.player2X, this.player2Y);
  }

  getHitAngle(xPosition: number, yPosition: number) : number {
    return Math.atan2(yPosition - this.ballY, xPosition - this.ballX);
  }

  update() : void {
    this.ballX += this.ballSpeed * Math.cos(this.ballAngle);
    this.ballY += this.ballSpeed * Math.sin(this.ballAngle);

    if (this.ballX < 0) {
      this.player2Score++;
      this.reset();
    }

    if (this.ballX > 800) {
      this.player1Score++;
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
