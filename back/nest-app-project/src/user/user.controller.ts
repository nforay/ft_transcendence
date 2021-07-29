import { Get, Post, Put, Delete, Param, Controller, UseFilters } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './user.dto'
import { Body } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';

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

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<UserDTO>) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

}
