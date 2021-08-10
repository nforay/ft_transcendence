import { Get, Post, Put, Delete, Param, Controller, Headers, Logger, Query, UploadedFile, HttpStatus, HttpException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './user.dto'
import { Body } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../shared/auth.guard';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path'
import * as jwt from 'jsonwebtoken';

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

  @Post('avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '../uploads/avatars',
      filename: (req, file, cb) => {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const filename = decoded.id;
          const extension = path.parse(file.originalname).ext;
          cb(null, `${filename}${extension}`);
        } catch (err) {
          throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
        }
      }
    })
  }))
  changeAvatar(@Headers() headers, @UploadedFile() file) {
    return this.userService.changeAvatar(file);
  }

  @Post('islogged')
  @UseGuards(AuthGuard)
  isLogged(@Headers() headers) {
    return this.userService.isLogged(headers.authorization);
  }
}
