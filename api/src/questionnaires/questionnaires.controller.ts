import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionUser } from '../auth/auth.service';

@Controller()
export class QuestionnairesController {
  constructor(private service: QuestionnairesService) {}

  /** Public: get published questionnaire */
  @Get('public/:tenantSlug/:questionnaireSlug')
  findPublished(
    @Param('tenantSlug') tenantSlug: string,
    @Param('questionnaireSlug') questionnaireSlug: string,
  ) {
    return this.service.findPublished(tenantSlug, questionnaireSlug);
  }

  /** Tenant users: list questionnaires for tenant */
  @Get('tenants/:tenantId/questionnaires')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.service.findByTenant(tenantId);
  }

  /** Authenticated: get questionnaire by ID */
  @Get('questionnaires/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Tenant users: create questionnaire */
  @Post('tenants/:tenantId/questionnaires')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateQuestionnaireDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.service.create(tenantId, user.id, dto);
  }

  /** Tenant users: update questionnaire */
  @Patch('questionnaires/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  update(@Param('id') id: string, @Body() dto: Partial<CreateQuestionnaireDto>) {
    return this.service.update(id, dto);
  }

  /** Tenant owner: publish */
  @Patch('questionnaires/:id/publish')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  /** Tenant owner: unpublish */
  @Patch('questionnaires/:id/unpublish')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  /** Tenant owner: delete questionnaire */
  @Delete('questionnaires/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
