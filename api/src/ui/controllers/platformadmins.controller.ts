import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PlatformAdminsUseCase } from '../../app/usecase/platformadmins/platformadmins.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller('platform-admins')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('platform_admin')
export class PlatformAdminsController {
  constructor(private readonly useCase: PlatformAdminsUseCase) {}

  @Get()
  findAll() {
    return this.useCase.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.useCase.findOne(id);
  }
}
