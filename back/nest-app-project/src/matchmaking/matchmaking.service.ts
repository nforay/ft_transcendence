import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameManager } from 'src/game/game.model';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken'

export class PlayerPair {
  player1Id: string;
  player2Id: string;
  player1Polled: boolean = false;
  player2Polled: boolean = false;

  constructor(player1Id: string, player2Id: string) {
    this.player1Id = player1Id;
    this.player2Id = player2Id;
  }

  hasId(playerId: string): boolean {
    return this.player1Id === playerId || this.player2Id === playerId;
  }
}

@Injectable()
export class MatchmakingService {

  queue: Array<string> = []
  paired: Array<PlayerPair> = []

  constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

  async join(authUser) {
    const user = await this.userRepository.findOne({ where: { id: authUser.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (this.queue.includes(user.id) || user.banned) {
      return { accepted: false };
    }
    this.queue.push(user.id);
    // Search match
    if (this.queue.length >= 2) {
      const opponent = this.queue.shift();
      this.paired.push(new PlayerPair(user.id, opponent));
      this.queue.splice(this.queue.indexOf(user.id), 1);
      const game = GameManager.instance.createGame(user.id, opponent);
      return { accepted: true, gameId: game.id };
    }
    return { accepted: true };
  }

  async poll(authUser) {
    const user = await this.userRepository.findOne({ where: { id: authUser.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const pair = this.paired.find(pair => pair.hasId(user.id))
    
    if (!pair)
      return { found: false };
    
    if (pair.player1Id == user.id)
      pair.player1Polled = true;
    if (pair.player2Id == user.id)
      pair.player2Polled = true;
    if (pair.player1Polled && pair.player2Polled)
      this.paired.splice(this.paired.indexOf(pair), 1);

    let game = GameManager.instance.getGameByPlayerId(user.id);
    if (!game)
      throw new HttpException('Fatal: Game not found while it should exist', HttpStatus.INTERNAL_SERVER_ERROR);

    const gameJwt = await jwt.sign({ gameId: game.id, playerId: user.id }, process.env.JWT_SECRET, {expiresIn: '1y'});
    game.setPlayerJwt(user.id, gameJwt);

    return { found: true, opponent: pair.player1Id === user.id ? pair.player2Id : pair.player1Id, gameId: game.id, gameJwt };
  }

  async leave(authUser) {
    const user = await this.userRepository.findOne({ where: { id: authUser.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!this.queue.includes(user.id)) {
      throw new HttpException('User not in queue', HttpStatus.BAD_REQUEST);
    }
    this.queue.splice(this.queue.indexOf(user.id), 1);

    const pair = this.paired.find(pair => pair.hasId(user.id));
    if (pair)
      this.paired.splice(this.paired.indexOf(pair), 1);

    GameManager.instance.cancelGameByPlayerId(user.id);

    return { left: true };
  }
}
