import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameManager } from '../game/game.model';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken'
import { GameSettingsDto } from './matchmaking.dto';

export class PlayerPair {
  player1: InQueuePlayer;
  player2: InQueuePlayer;
  player1Polled: boolean = false;
  player2Polled: boolean = false;

  constructor(player1Id: string, player2Id: string, p1settings: GameSettingsDto, p2settings: GameSettingsDto) {
    this.player1 = new InQueuePlayer(player1Id, p1settings);
    this.player2 = new InQueuePlayer(player2Id, p2settings);
  }

  hasId(playerId: string): boolean {
    return this.player1.id === playerId || this.player2.id === playerId;
  }
}

export class InQueuePlayer
{
  id: string;
  settings: GameSettingsDto;

  constructor(uuid: string, settings: GameSettingsDto) {
    this.id = uuid;
    this.settings = settings;
  }
}

@Injectable()
export class MatchmakingService {

  queue: Array<InQueuePlayer> = []
  paired: Array<PlayerPair> = []

  constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

  async join(authUser: any, settings: GameSettingsDto) {
    const user = await this.userRepository.findOne({ where: { id: authUser.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (this.queue.find(inQueuePlayer => { return user.id == inQueuePlayer.id }) || user.banned) {
      return { accepted: false };
    }
    this.queue.push(new InQueuePlayer(user.id, settings));

    // Search match
    const relevantQueue = this.queue.filter(inQueuePlayer => {
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      console.log(settings.powerup + '  ' + inQueuePlayer.settings.powerup);
      if (settings.powerup === 'no_powerup')
        return inQueuePlayer.settings.powerup === 'no_powerup'
      return inQueuePlayer.settings.powerup !== 'no_powerup'
    })

    if (relevantQueue.length >= 2) {
      const inQueueOpponent = relevantQueue.shift();
      this.paired.push(new PlayerPair(user.id, inQueueOpponent.id, settings, inQueueOpponent.settings));
      this.queue.splice(this.queue.findIndex(inQueuePlayer => { return inQueuePlayer.id === user.id }), 1);
      this.queue.splice(this.queue.findIndex(inQueuePlayer => { return inQueuePlayer.id === inQueueOpponent.id }), 1);
      const game = GameManager.instance.createGame(user.id, inQueueOpponent.id, settings.powerup, inQueueOpponent.settings.powerup);
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
    
    if (pair.player1.id == user.id)
      pair.player1Polled = true;
    if (pair.player2.id == user.id)
      pair.player2Polled = true;
    if (pair.player1Polled && pair.player2Polled)
      this.paired.splice(this.paired.indexOf(pair), 1);

    const game = GameManager.instance.getGameByPlayerId(user.id);
    if (!game) {
      this.leave(authUser);
      this.join(authUser, pair.player1.id === authUser.id ? pair.player1.settings : pair.player2.settings);
      return { found: false };
    }

    const gameJwt = await jwt.sign({ gameId: game.id, playerId: user.id }, process.env.JWT_SECRET, {expiresIn: '1y'});
    return { found: true, opponent: pair.player1.id === user.id ? pair.player2.id : pair.player1.id, gameId: game.id, gameJwt };
  }

  async leave(authUser) {
    const user = await this.userRepository.findOne({ where: { id: authUser.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!this.queue.find(inQueuePlayer => { return inQueuePlayer.id === user.id })) {
      return { left: true };
    }
    this.queue.splice(this.queue.findIndex(inQueuePlayer => { return inQueuePlayer.id === user.id }), 1);

    const pair = this.paired.find(pair => pair.hasId(user.id));
    if (pair)
      this.paired.splice(this.paired.indexOf(pair), 1);

    return { left: true };
  }
}
