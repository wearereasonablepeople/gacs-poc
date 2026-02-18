import { Controller, Post, Get, UseGuards, Req, Res, HttpCode, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalAuthGuard } from '../../infrastructure/auth';
import { AuthenticatedGuard } from '../guards';
import { LoginDto } from '../dto';
import { CurrentUser } from '../decorators';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() _dto: LoginDto, @CurrentUser() user: any) {
    return { user };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise<{ message: string }>((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        req.session.destroy((err) => {
          if (err) return reject(err);
          res.clearCookie('connect.sid');
          resolve({ message: 'Logged out' });
        });
      });
    });
  }
}
