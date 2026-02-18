import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TenantUsersUseCase } from '../../app/usecase/tenantusers/tenantusers.usecase';
import { CreateTenantUserDto } from '../dto';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller('tenants/:tenantId/users')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class TenantUsersController {
  constructor(private readonly useCase: TenantUsersUseCase) {}

  @Get()
  @Roles('platform_admin', 'tenant_owner')
  findAll(@Param('tenantId') tenantId: string) {
    return this.useCase.findByTenant(tenantId);
  }

  @Get(':id')
  @Roles('platform_admin', 'tenant_owner')
  findOne(@Param('id') id: string) {
    return this.useCase.findOne(id);
  }

  @Post()
  @Roles('platform_admin', 'tenant_owner')
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantUserDto) {
    return this.useCase.create(tenantId, dto);
  }

  @Patch(':id/deactivate')
  @Roles('platform_admin', 'tenant_owner')
  deactivate(@Param('id') id: string) {
    return this.useCase.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('platform_admin', 'tenant_owner')
  activate(@Param('id') id: string) {
    return this.useCase.activate(id);
  }

  @Delete(':id')
  @Roles('tenant_owner')
  remove(@Param('id') id: string) {
    return this.useCase.remove(id);
  }
}
