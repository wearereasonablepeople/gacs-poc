import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { GdprService } from '../gdpr/gdpr.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';

@Controller()
export class SubmissionsController {
  constructor(
    private service: SubmissionsService,
    private gdprService: GdprService,
  ) {}

  /** Public: start a new submission */
  @Post('submissions/start')
  startSubmission(@Body() body: { questionnaireId: string }) {
    return this.service.startSubmission(body.questionnaireId);
  }

  /** Public: save/update an answer */
  @Post('submissions/:submissionId/answers')
  saveAnswer(
    @Param('submissionId') submissionId: string,
    @Body() body: { questionId: string; selectedOptionId: string },
  ) {
    return this.service.saveAnswer(submissionId, body.questionId, body.selectedOptionId);
  }

  /** Public: get submission by ID (for respondent to review) */
  @Get('submissions/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Public: get full submission data for PDF generation */
  @Get('submissions/:id/pdf-data')
  getPdfData(@Param('id') id: string) {
    return this.service.getPdfData(id);
  }

  /** Admin: list submissions for questionnaire */
  @Get('questionnaires/:questionnaireId/submissions')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  findByQuestionnaire(@Param('questionnaireId') questionnaireId: string) {
    return this.service.findByQuestionnaire(questionnaireId);
  }

  /** Admin: list all submissions for tenant */
  @Get('tenants/:tenantId/submissions')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner', 'tenant_admin')
  async findByTenant(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = req.user as { id?: string; email?: string } | undefined;
    await this.gdprService.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: 'view_submissions',
      resource: 'submission',
      ipAddress: req.ip,
    });
    return this.service.findByTenant(tenantId);
  }

  /** Owner: export submission data */
  @Get('tenants/:tenantId/submissions/export')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('tenant_owner')
  exportByTenant(@Param('tenantId') tenantId: string) {
    return this.service.exportByTenant(tenantId);
  }
}
