import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionUser } from '../auth/auth.service';

@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  /** Public: get tenant by slug (for whitelabel branding) */
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  /** Platform admin: list all tenants */
  @Get()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  findAll() {
    return this.service.findAll();
  }

  /** Platform admin: get tenant by ID */
  @Get(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Platform admin: get tenant stats */
  @Get(':id/stats')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  getStats(@Param('id') id: string) {
    return this.service.getStats(id);
  }

  /** Platform admin: create a new tenant */
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: SessionUser) {
    return this.service.create(dto, user.id);
  }

  /** Platform admin or tenant owner: update tenant */
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }

  /** Platform admin: deactivate tenant */
  @Patch(':id/deactivate')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
