import { HttpException, HttpStatus, Injectable, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { ResponseGame } from './dto/response-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameEntity } from './entities/game.entity';
import { GameManager } from './game.model';
import * as jwt from 'jsonwebtoken'
import { UserManager } from '../user/user.model';

@Injectable()
export class GameService {

  constructor(@InjectRepository(GameEntity) private readonly gameRepository: Repository<GameEntity>) {
    GameManager.instance.gameRepository = this.gameRepository;
  }

  async create(createGameDto: CreateGameDto) : Promise<ResponseGame> {
    const game = this.gameRepository.create(createGameDto);
    if (!game)
      throw new HttpException('Could not create game', HttpStatus.INTERNAL_SERVER_ERROR);
    await this.gameRepository.save(game);
    return game.toResponseGame();
  }

  async findAll() : Promise<ResponseGame[]> {
    const games = await this.gameRepository.find();
    return games.map(game => game.toResponseGame());
  }

  getActive() {
    return { games: GameManager.instance.getGames().map(game => { return game.toResponseGame() }) };
  }

  async requestSpectator(decoded: any, id: string) {
    const user = await UserManager.instance.userRepository.findOne({where: { id: decoded.id} })
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const game = GameManager.instance.getGames().find(game => game.id === id);
    if (!game)
      throw new HttpException(`Game with id ${id} not found`, HttpStatus.NOT_FOUND);
    const gameJwt = await jwt.sign({ gameId: game.id, playerId: user.id, spectator: true }, process.env.JWT_SECRET, {expiresIn: '1y'});
    return { gameJwt };
  }

  async findOne(id: string) : Promise<ResponseGame> {
    const game = await this.gameRepository.findOne({ where: { id } });
    if (!game)
      throw new HttpException(`Game with id ${id} not found`, HttpStatus.NOT_FOUND);
    return game.toResponseGame();
  }

  async update(id: string, updateGameDto: UpdateGameDto) : Promise<ResponseGame> {
    const game = await this.gameRepository.findOne({ where: { id } });
    if (!game)
      throw new HttpException(`Game with id ${id} not found`, HttpStatus.NOT_FOUND);
    await this.gameRepository.update(id, updateGameDto);
    return game.toResponseGame();
  }

  async remove(id: string) : Promise<ResponseGame> {
    const game = await this.gameRepository.findOne({ where: { id } });
    if (!game)
      throw new HttpException(`Game with id ${id} not found`, HttpStatus.NOT_FOUND);
    await this.gameRepository.remove(game);
    return game.toResponseGame();
  }
}
