import { HttpException, HttpStatus, Injectable, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { ResponseGame } from './dto/response-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameEntity } from './entities/game.entity';

@Injectable()
export class GameService {

  constructor(@InjectRepository(GameEntity) private readonly gameRepository: Repository<GameEntity>) {}

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
