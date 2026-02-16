import { Controller, Post, Get, UseGuards, Req, Res, HttpCode, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionUser } from './auth.service';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() _dto: LoginDto, @CurrentUser() user: SessionUser) {
    return { user };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  me(@CurrentUser() user: SessionUser) {
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
