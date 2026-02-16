import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TenantUsersService } from './tenant-users.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tenants/:tenantId/users')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class TenantUsersController {
  constructor(private service: TenantUsersService) {}

  @Get()
  @Roles('platform_admin', 'tenant_owner')
  findAll(@Param('tenantId') tenantId: string) {
    return this.service.findByTenant(tenantId);
  }

  @Get(':id')
  @Roles('platform_admin', 'tenant_owner')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('platform_admin', 'tenant_owner')
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantUserDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id/deactivate')
  @Roles('platform_admin', 'tenant_owner')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('platform_admin', 'tenant_owner')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Delete(':id')
  @Roles('tenant_owner')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
