import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PlatformAdminsService } from './platform-admins.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('platform-admins')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('platform_admin')
export class PlatformAdminsController {
  constructor(private service: PlatformAdminsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
