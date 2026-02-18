import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SubmissionsUseCase } from '../../app/usecase/submissions/submissions.usecase';
import { GdprUseCase } from '../../app/usecase/gdpr/gdpr.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';
import { Request } from 'express';

@Controller()
export class SubmissionsController {
  constructor(
    private readonly useCase: SubmissionsUseCase,
    private readonly gdprUseCase: GdprUseCase,
  ) {}

  @Post('submissions/start')
  startSubmission(@Body() body: { questionnaireId: string }) {
    return this.useCase.startSubmission(body.questionnaireId);
  }

  @Post('submissions/:submissionId/answers')
  saveAnswer(
    @Param('submissionId') submissionId: string,
    @Body() body: { questionId: string; selectedOptionId: string },
  ) {
    return this.useCase.saveAnswer(submissionId, body.questionId, body.selectedOptionId);
  }

  @Get('submissions/:id')
  findOne(@Param('id') id: string) {
    return this.useCase.findOne(id);
  }

  @Get('submissions/:id/pdf-data')
  getPdfData(@Param('id') id: string) {
    return this.useCase.getPdfData(id);
  }

  @Get('questionnaires/:questionnaireId/submissions')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  findByQuestionnaire(@Param('questionnaireId') questionnaireId: string) {
    return this.useCase.findByQuestionnaire(questionnaireId);
  }

  @Get('tenants/:tenantId/submissions')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  async findByTenant(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = req.user as { id?: string; email?: string } | undefined;
    await this.gdprUseCase.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'view_submissions',
      resource: 'submission',
      ipAddress: req.ip,
    });
    return this.useCase.findByTenant(tenantId);
  }

  @Get('tenants/:tenantId/submissions/export')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  exportByTenant(@Param('tenantId') tenantId: string) {
    return this.useCase.exportByTenant(tenantId);
  }
}
