import { Get, Post, Put, Delete, Param, Controller, Headers, Logger, Query, UploadedFile, HttpStatus, HttpException, Res, Header } from '@nestjs/common';
import { UserService } from './user.service';
import { SecretCodeDTO, UserDTO, UserPassDTO } from './user.dto'
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
import { AuthUser } from '../shared/auth-user.decorator';

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

  @Post('validate2fa')
  validate2FA(@Body() data: SecretCodeDTO) {
    return this.userService.validate2FA(data);
  }

  @Post('disable2fa')
  disable2FA(@Body() data: SecretCodeDTO) {
    return this.userService.disable2FA(data);
  }

  @Post('disable2fapass')
  disable2FAPass(@Body() data: UserPassDTO) {
    return this.userService.disable2FAPass(data);
  }

  @Get('username/:name')
  findByName(@Param('name') name: string) {
    return this.userService.findByName(name);
  }

  @Get('qr2fa')
  generateQrCode(@AuthUser() user) {
    return this.userService.generateQrCode(user);
  }

  @Get('has2fa')
  has2fa(@AuthUser() user) {
    return this.userService.has2fa(user);
  }

  @Post('send2facode')
  send2FACode(@Body() data: SecretCodeDTO) {
    return this.userService.send2FACode(data);
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

  @Get('avatar')
  getDefaultAvatar(@Res() response) {
    return response.sendFile(path.join(process.cwd(), '../uploads/avatars', 'default.jpg'));
  }

  @Get('avatar/:id')
  getAvatar(@Param('id', ParseUUIDPipe) id: string, @Res() response) {
    const filePath = path.join(process.cwd(), '../uploads/avatars', id + '.jpg');
    if (fs.existsSync(filePath))
    return response.sendFile(filePath);
    return response.sendFile(path.join(process.cwd(), '../uploads/avatars', 'default.jpg'));
  }

  @Post('islogged')
  @UseGuards(AuthGuard)
  isLogged(@Headers() headers) {
    return this.userService.isLogged(headers.authorization);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

	@Get('friends/:id')
	getFriends(@Param('id', ParseUUIDPipe) id: string) {
		return this.userService.getFriends(id);
	}

	@Get('friends/check/:id/:name')
	isFriend(@Param('id', ParseUUIDPipe) id: string, @Param('name') name: string) {
		return this.userService.isFriend(id, name);
	}

	@Post('friends/:id/:name')
	addFriend(@Param('id', ParseUUIDPipe) id: string, @Param('name') name: string) {
		return this.userService.addFriend(id, name);
	}

	@Delete('friends/:id/:name')
	rmFriend(@Param('id', ParseUUIDPipe) id: string, @Param('name') name: string) {
		return this.userService.rmFriend(id, name);
	}

  @Put('update')
  @Header('Content-Type', 'application/json')
  @UseGuards(AuthGuard)
  update(@Headers() headers, @Body() data: Partial<UserDTO>) {
    return this.userService.update(headers.authorization, data);
  }
}
