import { Controller, Get, Delete, Put, Param, Query, Body, UseGuards, Post, Req } from '@nestjs/common';
import { GdprUseCase } from '../../app/usecase/gdpr/gdpr.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';
import { Request } from 'express';

@Controller()
export class GdprController {
  constructor(private readonly useCase: GdprUseCase) {}

  @Post('gdpr/erasure-request')
  requestErasure(@Body() body: { email: string; tenantSlug: string }) {
    return this.useCase.requestErasureByEmail(body.email, body.tenantSlug);
  }

  @Get('gdpr/respondents/:id/export')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'platform_admin')
  async exportRespondentData(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { tenantId?: string; email?: string; id?: string } | undefined;
    if (user?.tenantId) {
      await this.useCase.logAction({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'gdpr_export_respondent',
        resource: 'respondent',
        resourceId: id,
        ipAddress: req.ip,
      });
    }
    return this.useCase.exportRespondentData(id);
  }

  @Delete('gdpr/respondents/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'platform_admin')
  async deleteRespondentData(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { tenantId?: string; email?: string; id?: string } | undefined;
    if (user?.tenantId) {
      await this.useCase.logAction({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'gdpr_delete_respondent',
        resource: 'respondent',
        resourceId: id,
        ipAddress: req.ip,
      });
    }
    return this.useCase.deleteRespondentData(id);
  }

  @Get('tenants/:tenantId/gdpr/retention')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  getRetention(@Param('tenantId') tenantId: string) {
    return this.useCase.getRetentionSettings(tenantId);
  }

  @Put('tenants/:tenantId/gdpr/retention')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  async updateRetention(
    @Param('tenantId') tenantId: string,
    @Body() body: { retentionDays: number },
    @Req() req: Request,
  ) {
    const user = req.user as { email?: string; id?: string } | undefined;
    await this.useCase.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'gdpr_update_retention',
      resource: 'tenant',
      resourceId: tenantId,
      details: `Retention updated to ${body.retentionDays} days`,
      ipAddress: req.ip,
    });
    return this.useCase.updateRetentionSettings(tenantId, body.retentionDays);
  }

  @Get('tenants/:tenantId/gdpr/export-all')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  async exportAll(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = req.user as { email?: string; id?: string } | undefined;
    await this.useCase.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'gdpr_export_all',
      resource: 'tenant',
      resourceId: tenantId,
      ipAddress: req.ip,
    });
    return this.useCase.exportAllTenantData(tenantId);
  }

  @Get('tenants/:tenantId/gdpr/audit-log')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  getAuditLog(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.useCase.getAuditLog(
      tenantId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('gdpr/purge')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  purgeExpiredData() {
    return this.useCase.purgeExpiredData();
  }
}
