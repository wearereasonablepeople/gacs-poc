import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  IQuestionnaireRepository,
  IQuestionOptionRepository,
  ISubmissionRepository,
  QUESTION_OPTION_REPOSITORY,
  QUESTIONNAIRE_REPOSITORY,
  SUBMISSION_REPOSITORY,
} from "../../../domain/repositories";
import {
  SubmissionFilters,
  SubmissionStatusFilter,
} from "../../../domain/entities";

@Injectable()
export class SubmissionsUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissionRepo: ISubmissionRepository,
    @Inject(QUESTION_OPTION_REPOSITORY)
    private readonly optionRepo: IQuestionOptionRepository,
    @Inject(QUESTIONNAIRE_REPOSITORY)
    private readonly questionnaireRepo: IQuestionnaireRepository,
  ) {}

  async startSubmission(questionnaireId: string) {
    const q = await this.questionnaireRepo.findOne(questionnaireId);
    if (!q || !(q as any).isPublished)
      throw new BadRequestException("Questionnaire not found or not published");
    return this.submissionRepo.create({
      questionnaireId,
      startedAt: new Date(),
    } as any);
  }

  async saveAnswer(
    submissionId: string,
    questionId: string,
    selectedOptionId: string,
  ) {
    const submission = await this.submissionRepo.findOne(submissionId);
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }
    if (submission.submittedAt) {
      throw new BadRequestException("Submission already finalized");
    }

    const option = await this.optionRepo.findOne(selectedOptionId);
    if (!option || (option as any).questionId !== questionId) {
      throw new BadRequestException(
        "Selected option does not belong to this question",
      );
    }
    return this.submissionRepo.upsertAnswer(
      submissionId,
      questionId,
      selectedOptionId,
    );
  }

  async findOne(id: string) {
    const submission = await this.submissionRepo.findOneWithDetails(id);
    if (!submission) throw new NotFoundException("Submission not found");
    const totalQuestions = submission.questionnaire.sections.reduce(
      (sum: number, sec: any) => sum + sec._count.questions,
      0,
    );
    const { sections: _sections, ...questionnaire } = submission.questionnaire;
    return { ...submission, questionnaire, totalQuestions };
  }

  async findByQuestionnaire(questionnaireId: string) {
    const submissions =
      await this.submissionRepo.findByQuestionnaire(questionnaireId);
    return submissions.map((s: any) => {
      const totalQuestions = s.questionnaire.sections.reduce(
        (sum: number, sec: any) => sum + sec._count.questions,
        0,
      );
      const { questionnaire: _q, ...rest } = s;
      return { ...rest, totalQuestions };
    });
  }

  async findByTenant(tenantId: string, filters?: SubmissionFilters) {
    const submissions = await this.submissionRepo.findByTenant(tenantId, filters);
    return this.applyStatusFilter(submissions, filters?.status);
  }

  async exportByTenant(tenantId: string, filters?: SubmissionFilters) {
    const submissions = await this.submissionRepo.exportByTenant(tenantId, filters);
    return this.applyStatusFilter(submissions, filters?.status).map((submission: any) => ({
      Respondent: submission.respondent?.email ?? "",
      Questionnaire: submission.questionnaire?.title ?? "",
      Answers: `${submission._count.answers} / ${submission.totalQuestions}`,
      Status: submission.status === "completed" ? "Completed" : "Incomplete",
      Completed: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleDateString()
        : "—",
    }));
  }

  private applyStatusFilter(submissions: any[], status?: SubmissionStatusFilter) {
    const statusFilter: SubmissionStatusFilter = status ?? "all";
    return submissions
      .map((s: any) => {
      const totalQuestions = s.questionnaire.sections.reduce(
        (sum: number, sec: any) => sum + sec._count.questions,
        0,
      );
      const { sections: _sections, ...questionnaire } = s.questionnaire;
      const isComplete =
        Boolean(s.submittedAt) &&
        s._count.answers >= totalQuestions &&
        totalQuestions > 0;
      return { ...s, questionnaire, totalQuestions, status: isComplete ? "completed" : "incomplete" };
    })
      .filter((submission: any) => {
        if (statusFilter === "all") return true;
        return submission.status === statusFilter;
      });
  }

  async getPdfData(id: string) {
    const submission = await this.submissionRepo.getPdfData(id);
    if (!submission) throw new NotFoundException("Submission not found");

    const answerMap = new Map<
      string,
      { id: string; label: string; groupLabel?: string }
    >(submission.answers.map((a: any) => [a.question.id, a.selectedOption]));

    return {
      id: submission.id,
      submittedAt: submission.submittedAt,
      respondentEmail: submission.respondent?.email ?? null,
      questionnaire: {
        title: submission.questionnaire.title,
        tenant: submission.questionnaire.tenant,
        sections: submission.questionnaire.sections.map((section: any) => ({
          code: section.code,
          title: section.title,
          questions: section.questions.map((q: any) => {
            const selected = answerMap.get(q.id);
            const selectedFull = selected
              ? q.options.find((o: any) => o.id === selected.id)
              : null;
            const allowedOptions = q.options
              .filter((o: any) => o.isAllowed === true)
              .map((o: any) => o.label);

            return {
              code: q.code,
              prompt: q.prompt,
              selectedOption: selected
                ? {
                    label: selected.label,
                    groupLabel: selected.groupLabel,
                    isAllowed: selectedFull?.isAllowed ?? null,
                  }
                : null,
              allowedOptions,
            };
          }),
        })),
      },
    };
  }

}
