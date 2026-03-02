import {
  BadRequestException,
  Body,
  Controller,
  Get,
  UnauthorizedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { GdprUseCase } from "../../app/usecase/gdpr/gdpr.usecase";
import { SubmissionsUseCase } from "../../app/usecase/submissions/submissions.usecase";
import {
  SubmissionFilters,
  SubmissionLeadStatus,
  SubmissionStatusFilter,
} from "../../domain/entities";
import { Roles } from "../decorators";
import { AuthenticatedGuard, RolesGuard } from "../guards";

@Controller()
export class SubmissionsController {
  constructor(
    private readonly useCase: SubmissionsUseCase,
    private readonly gdprUseCase: GdprUseCase,
  ) {}

  @Post("submissions/start")
  startSubmission(@Body() body: { questionnaireId: string }) {
    return this.useCase.startSubmission(body.questionnaireId);
  }

  @Post("submissions/:submissionId/answers")
  saveAnswer(
    @Param("submissionId") submissionId: string,
    @Body() body: { questionId: string; selectedOptionId: string },
  ) {
    return this.useCase.saveAnswer(
      submissionId,
      body.questionId,
      body.selectedOptionId,
    );
  }

  @Patch("submissions/:id/lead-status")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner", "tenant_admin")
  updateLeadStatus(
    @Param("id") id: string,
    @Req() req: Request,
    @Body() body: { leadStatus?: SubmissionLeadStatus },
  ) {
    const user = req.user as { tenantId?: string } | undefined;
    if (!user?.tenantId) {
      throw new UnauthorizedException("Unauthorized");
    }
    const leadStatus = this.parseLeadStatus(body?.leadStatus);
    return this.useCase.updateLeadStatus(id, user.tenantId, leadStatus);
  }

  @Get("submissions/:id")
  findOne(@Param("id") id: string) {
    return this.useCase.findOne(id);
  }

  @Get("submissions/:id/pdf-data")
  getPdfData(@Param("id") id: string) {
    return this.useCase.getPdfData(id);
  }

  @Post("questionnaires/:questionnaireId/pdf-preview-data")
  getPdfPreviewData(
    @Param("questionnaireId") questionnaireId: string,
    @Body() body: { answers: Record<string, string> },
  ) {
    return this.useCase.getPdfPreviewData(questionnaireId, body?.answers ?? {});
  }

  @Get("questionnaires/:questionnaireId/submissions")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner", "tenant_admin")
  findByQuestionnaire(@Param("questionnaireId") questionnaireId: string) {
    return this.useCase.findByQuestionnaire(questionnaireId);
  }

  @Get("tenants/:tenantId/submissions")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner", "tenant_admin")
  async findByTenant(
    @Param("tenantId") tenantId: string,
    @Req() req: Request,
    @Query("email") email?: string,
    @Query("questionnaire") questionnaire?: string,
    @Query("status") status?: SubmissionStatusFilter,
    @Query("createdFrom") createdFrom?: string,
    @Query("createdTo") createdTo?: string,
  ) {
    const user = req.user as { id?: string; email?: string } | undefined;
    await this.gdprUseCase.logAction({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      action: "view_submissions",
      resource: "submission",
      ipAddress: req.ip,
    });

    return this.useCase.findByTenant(
      tenantId,
      this.parseSubmissionFilters(
        email,
        questionnaire,
        status,
        createdFrom,
        createdTo,
      ),
    );
  }

  @Get("tenants/:tenantId/submissions/export")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner")
  exportByTenant(
    @Param("tenantId") tenantId: string,
    @Query("email") email?: string,
    @Query("questionnaire") questionnaire?: string,
    @Query("status") status?: SubmissionStatusFilter,
    @Query("createdFrom") createdFrom?: string,
    @Query("createdTo") createdTo?: string,
  ) {
    return this.useCase.exportByTenant(
      tenantId,
      this.parseSubmissionFilters(
        email,
        questionnaire,
        status,
        createdFrom,
        createdTo,
      ),
    );
  }

  private parseSubmissionFilters(
    email?: string,
    questionnaire?: string,
    status?: SubmissionStatusFilter,
    createdFrom?: string,
    createdTo?: string,
  ): SubmissionFilters {
    return {
      email,
      questionnaire,
      status:
        status === "open" || status === "in_progress" || status === "closed"
          ? status
          : "all",
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
    };
  }

  private parseLeadStatus(value?: SubmissionLeadStatus): SubmissionLeadStatus {
    if (value === "open" || value === "in_progress" || value === "closed") {
      return value;
    }
    throw new BadRequestException("Invalid lead status");
  }
}
