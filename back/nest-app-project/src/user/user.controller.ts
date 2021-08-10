import { Get, Post, Put, Delete, Param, Controller, Headers, Logger, Query, UploadedFile, HttpStatus, HttpException, Res } from '@nestjs/common';
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
import * as FileType from 'file-type'
import * as fs from 'fs';

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
    }),
    fileFilter: async (req, file, cb) => {
      const allowedDottedExtensions = [ '.jpg', '.jpeg', '.png' ];
      cb(null, allowedDottedExtensions.includes(path.parse(file.originalname).ext));
    }
  }))
  async changeAvatar(@Headers() headers, @UploadedFile() file) {
    if (!file)
      throw new HttpException('File must be of type png/jpeg/jpg', HttpStatus.BAD_REQUEST);
    
    Logger.log('Bonjour !!!! ' + file.path, 'info');

    const filetype = await FileType.fromFile(file.path);
    const allowedMimes = [ 'image/jpg', 'image/jpeg', 'image/png' ];
    const allowedExtensions = [ 'jpg', 'jpeg', 'png' ];

    if (!allowedMimes.includes(filetype.mime) || !allowedExtensions.includes(filetype.ext.toLowerCase()))
    {
      fs.unlinkSync(file.path);
      throw new HttpException('File must be of type png/jpeg/jpg', HttpStatus.BAD_REQUEST);
    }

    return this.userService.changeAvatar(file);
  }

  @Get('avatar/:id')
  getAvatar(@Param('id', ParseUUIDPipe) id: string, @Res() response) {
    return response.sendFile(path.join(process.cwd(), '../uploads/avatars', id + '.jpg'));
  }

  @Post('islogged')
  @UseGuards(AuthGuard)
  isLogged(@Headers() headers) {
    return this.userService.isLogged(headers.authorization);
  }
}
