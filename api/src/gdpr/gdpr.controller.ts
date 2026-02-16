import { Controller, Get, Delete, Put, Param, Query, Body, UseGuards, Post, Req } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';

@Controller()
export class GdprController {
  constructor(private gdprService: GdprService) {}

  // ──────────────────────────────────────────
  // PUBLIC: Self-service erasure request
  // ──────────────────────────────────────────

  /** Public: request erasure of personal data by email */
  @Post('gdpr/erasure-request')
  requestErasure(@Body() body: { email: string; tenantSlug: string }) {
    return this.gdprService.requestErasureByEmail(body.email, body.tenantSlug);
  }

  // ──────────────────────────────────────────
  // ADMIN: Respondent data management
  // ──────────────────────────────────────────

  /** Export respondent data (GDPR portability) */
  @Get('gdpr/respondents/:id/export')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'platform_admin')
  async exportRespondentData(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { tenantId?: string; email?: string; id?: string } | undefined;
    if (user?.tenantId) {
      await this.gdprService.logAction({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'gdpr_export_respondent',
        resource: 'respondent',
        resourceId: id,
        ipAddress: req.ip,
      });
    }
    return this.gdprService.exportRespondentData(id);
  }

  /** Delete respondent data (GDPR erasure) */
  @Delete('gdpr/respondents/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'platform_admin')
  async deleteRespondentData(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { tenantId?: string; email?: string; id?: string } | undefined;
    if (user?.tenantId) {
      await this.gdprService.logAction({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'gdpr_delete_respondent',
        resource: 'respondent',
        resourceId: id,
        ipAddress: req.ip,
      });
    }
    return this.gdprService.deleteRespondentData(id);
  }

  // ──────────────────────────────────────────
  // ADMIN: Retention settings
  // ──────────────────────────────────────────

  /** Get retention settings for tenant */
  @Get('tenants/:tenantId/gdpr/retention')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  getRetention(@Param('tenantId') tenantId: string) {
    return this.gdprService.getRetentionSettings(tenantId);
  }

  /** Update retention settings */
  @Put('tenants/:tenantId/gdpr/retention')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  async updateRetention(
    @Param('tenantId') tenantId: string,
    @Body() body: { retentionDays: number },
    @Req() req: Request,
  ) {
    const user = req.user as { email?: string; id?: string } | undefined;
    await this.gdprService.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'gdpr_update_retention',
      resource: 'tenant',
      resourceId: tenantId,
      details: `Retention updated to ${body.retentionDays} days`,
      ipAddress: req.ip,
    });
    return this.gdprService.updateRetentionSettings(tenantId, body.retentionDays);
  }

  // ──────────────────────────────────────────
  // ADMIN: Full data export
  // ──────────────────────────────────────────

  /** Export all tenant respondent data */
  @Get('tenants/:tenantId/gdpr/export-all')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  async exportAll(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = req.user as { email?: string; id?: string } | undefined;
    await this.gdprService.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'gdpr_export_all',
      resource: 'tenant',
      resourceId: tenantId,
      ipAddress: req.ip,
    });
    return this.gdprService.exportAllTenantData(tenantId);
  }

  // ──────────────────────────────────────────
  // ADMIN: Audit log
  // ──────────────────────────────────────────

  /** Get audit log for tenant */
  @Get('tenants/:tenantId/gdpr/audit-log')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  getAuditLog(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.gdprService.getAuditLog(
      tenantId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ──────────────────────────────────────────
  // PLATFORM: Data purge
  // ──────────────────────────────────────────

  /** Purge expired data — platform admins only */
  @Post('gdpr/purge')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('platform_admin')
  purgeExpiredData() {
    return this.gdprService.purgeExpiredData();
  }
}
