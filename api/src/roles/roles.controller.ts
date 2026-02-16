import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';

@Controller('roles')
@UseGuards(AuthenticatedGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
}
