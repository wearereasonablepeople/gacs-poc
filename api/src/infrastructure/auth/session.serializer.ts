import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { SessionUser } from './local.strategy';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: SessionUser, done: (err: Error | null, user: SessionUser) => void) {
    done(null, user);
  }

  deserializeUser(payload: SessionUser, done: (err: Error | null, user: SessionUser) => void) {
    done(null, payload);
  }
}
