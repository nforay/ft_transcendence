export class ResponseGame {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  // Useful if the player with the most points disconnected or lost for some reason
  player1Won: boolean;
}
