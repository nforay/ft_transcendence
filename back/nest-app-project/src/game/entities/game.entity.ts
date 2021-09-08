import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CreateGameDto } from "../dto/create-game.dto";
import { ResponseGame } from "../dto/response-game.dto";

@Entity('game')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn() created: Date;

  @Column({ type: 'text' }) player1Id: string;
  @Column({ type: 'text' }) player2Id: string;
  @Column({ type: 'smallint' }) player1Score: number;
  @Column({ type: 'smallint' }) player2Score: number;
  @Column({ type: 'boolean' }) player1Won: boolean;

  toResponseGame() : ResponseGame {
    return {
      id: this.id,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      player1Won: this.player1Won
    }
  }
}
