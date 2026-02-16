import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { RespondentsService } from './respondents.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class RespondentsController {
  constructor(private service: RespondentsService) {}

  /** Public: submit email for verification */
  @Post('submissions/:submissionId/email')
  submitEmail(
    @Param('submissionId') submissionId: string,
    @Body() body: { email: string; consentGiven?: boolean },
  ) {
    return this.service.submitEmail(submissionId, body.email, body.consentGiven);
  }

  /** Public: verify email */
  @Get('verify-email')
  verifyEmail(
    @Query('token') token: string,
    @Query('submission') submissionId: string,
  ) {
    return this.service.verifyEmail(token, submissionId);
  }

  /** Admin: list respondents for tenant (supports ?search= query) */
  @Get('tenants/:tenantId/respondents')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.service.findByTenant(tenantId, search);
  }
}
