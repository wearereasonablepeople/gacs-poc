import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesUseCase } from '../../app/usecase/roles/roles.usecase';
import { AuthenticatedGuard } from '../guards';

@Controller('roles')
@UseGuards(AuthenticatedGuard)
export class RolesController {
  constructor(private readonly rolesUseCase: RolesUseCase) {}

  @Get()
  findAll() {
    return this.rolesUseCase.findAll();
  }
}
