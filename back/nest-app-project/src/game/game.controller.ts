import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { AdminGuard } from '../shared/admin.guard';
import { AuthUser } from 'src/shared/auth-user.decorator';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gameService.create(createGameDto);
  }

  @Get()
  findAll() {
    return this.gameService.findAll();
  }

  @Get('active')
  getActive() {
    return this.gameService.getActive();
  }

  @Get('requestSpectate')
  requestSpectate(@AuthUser() user, @Query('id') id: string) {
    return this.gameService.requestSpectator(user, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gameService.update(id, updateGameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gameService.remove(id);
  }

}
