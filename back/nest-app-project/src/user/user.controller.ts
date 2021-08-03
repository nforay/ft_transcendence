import { Get, Post, Put, Delete, Param, Controller, UseFilters } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './user.dto'
import { Body } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/shared/auth.guard';
import { HttpErrorFilter } from 'src/shared/http-error.filter';

@Controller('user')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(){
    return this.userService.findAll();
  }

  @Post()
  create(@Body() data: UserDTO) {
    return this.userService.create(data);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Get('username/:name')
  findByName(@Param('name') name: string) {
    return this.userService.findByName(name);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<UserDTO>) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  @Post('login')
  login(@Body() data: Partial<UserDTO>) {
    return this.userService.login(data);
  }

  @Post('islogged')
  isLogged(@Body() data: string) {
    return this.userService.isLogged(data);
  }
}
