import { Get, Post, Put, Delete, Param, Controller, Headers, Query, UploadedFile, HttpStatus, HttpException, Res, Header } from '@nestjs/common';
import { UserService } from './user.service';
import { SecretCodeDTO, UserDTO, UserUpdateDTO } from './user.dto'
import { Body } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../shared/auth.guard';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path'
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { AuthUser } from '../shared/auth-user.decorator';
import * as FileType from 'file-type';

@Controller('user')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(){
    return this.userService.findAll();
  }

  @Post('authenticate')
  authenticate(@Query('code') code: string) {
    return this.userService.authenticate(code);
  }

  @Post('block')
  block(@AuthUser() user, @Query('name') name: string) {
    return this.userService.block(user, name);
  }

  @Post('unblock')
  unblock(@AuthUser() user, @Query('name') name: string) {
    return this.userService.unblock(user, name);
  }

  @Get('isBlocked')
  isBlocked(@AuthUser() user, @Query('name') name: string) {
    return this.userService.isBlocked(user, name);
  }

  @Post('updateOnlineStatus')
  updateOnlineStatus(@AuthUser() user) {
    return this.userService.updateOnlineStatus(user);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('rangeMin') rangeMin: number, @Query('rangeMax') rangeMax: number) {
    return this.userService.getLeaderboard(rangeMin, rangeMax);
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

    const filetype = await FileType.fromFile(file.path)
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

  /*@Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user) {
		if (user.role !== 'admin') {
			throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
		}
    return this.userService.remove(id);
  }*/

  @Get('friends/name/:name')
	getFriendsByName(@Param('name') name: string) {
		return this.userService.getFriends(name);
	}

  @Get('history/name/:name')
	getHistoryByName(@Param('name') name: string) {
		return this.userService.getHistory(name);
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

	@Post('/admin/:id')
	opuser(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user) {
		if (user.role !== 'admin') {
			throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
		}
		return this.userService.opuser(id);
	}

  @Put('update')
  @Header('Content-Type', 'application/json')
  @UseGuards(AuthGuard)
  update(@Headers() headers, @Body() data: UserUpdateDTO) {
    return this.userService.update(headers.authorization, data);
  }
}
