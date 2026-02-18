import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BcryptPasswordHasher, LocalStrategy, SessionSerializer, AUTH_USE_CASE } from '../auth';
import { PASSWORD_HASHER_PORT } from '../../domain/ports';
import { AuthUseCase } from '../../app/usecase/auth/auth.usecase';
import { AuthController } from '../../ui/controllers/auth.controller';

@Global()
@Module({
  imports: [PassportModule.register({ session: true })],
  providers: [
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasher },
    { provide: AUTH_USE_CASE, useExisting: AuthUseCase },
    AuthUseCase,
    LocalStrategy,
    SessionSerializer,
  ],
  controllers: [AuthController],
  exports: [PASSWORD_HASHER_PORT, AuthUseCase],
})
export class AuthInfraModule {}
