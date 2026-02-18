import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { RespondentsUseCase } from '../../app/usecase/respondents/respondents.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller()
export class RespondentsController {
  constructor(private readonly useCase: RespondentsUseCase) {}

  @Post('submissions/:submissionId/email')
  submitEmail(
    @Param('submissionId') submissionId: string,
    @Body() body: { email: string; consentGiven?: boolean },
  ) {
    return this.useCase.submitEmail(submissionId, body.email, body.consentGiven);
  }

  @Get('verify-email')
  verifyEmail(
    @Query('token') token: string,
    @Query('submission') submissionId: string,
  ) {
    return this.useCase.verifyEmail(token, submissionId);
  }

  @Get('tenants/:tenantId/respondents')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.useCase.findByTenant(tenantId, search);
  }
}
