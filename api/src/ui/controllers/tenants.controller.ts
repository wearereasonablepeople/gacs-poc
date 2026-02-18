import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsUseCase } from '../../app/usecase/tenants/tenants.usecase';
import { CreateTenantDto, UpdateTenantDto } from '../dto';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles, CurrentUser } from '../decorators';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly useCase: TenantsUseCase) {}

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.useCase.findBySlug(slug);
  }

  @Get()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  findAll() {
    return this.useCase.findAll();
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  findOne(@Param('id') id: string) {
    return this.useCase.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  getStats(@Param('id') id: string) {
    return this.useCase.getStats(id);
  }

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: any) {
    return this.useCase.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.useCase.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  deactivate(@Param('id') id: string) {
    return this.useCase.deactivate(id);
  }
}
