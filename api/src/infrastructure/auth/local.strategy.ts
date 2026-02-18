import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  roleId: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
}

export const AUTH_USE_CASE = Symbol('AUTH_USE_CASE');

export interface IAuthUseCase {
  validate(email: string, password: string, tenantSlug?: string): Promise<SessionUser>;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(AUTH_USE_CASE) private authUseCase: IAuthUseCase) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<SessionUser> {
    const tenantSlug = req.body?.tenantSlug;
    return this.authUseCase.validate(email, password, tenantSlug);
  }
}
