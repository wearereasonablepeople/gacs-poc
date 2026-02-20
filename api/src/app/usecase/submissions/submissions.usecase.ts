import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  SubmissionFilters,
  SubmissionLeadStatus,
} from "../../../domain/entities";
import {
  IQuestionnaireRepository,
  IQuestionOptionRepository,
  ISubmissionRepository,
  QUESTION_OPTION_REPOSITORY,
  QUESTIONNAIRE_REPOSITORY,
  SUBMISSION_REPOSITORY,
} from "../../../domain/repositories";

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
    return {
      ...submission,
      questionnaire,
      totalQuestions,
      leadStatus: (submission.leadStatus ?? "open") as SubmissionLeadStatus,
    };
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
      return {
        ...rest,
        totalQuestions,
        leadStatus: (s.leadStatus ?? "open") as SubmissionLeadStatus,
      };
    });
  }

  async findByTenant(tenantId: string, filters?: SubmissionFilters) {
    const submissions = await this.submissionRepo.findByTenant(tenantId, filters);
    return submissions.map((s: any) => {
      const totalQuestions = s.questionnaire.sections.reduce(
        (sum: number, sec: any) => sum + sec._count.questions,
        0,
      );
      const { sections: _sections, ...questionnaire } = s.questionnaire;
      return {
        ...s,
        questionnaire,
        totalQuestions,
        leadStatus: (s.leadStatus ?? "open") as SubmissionLeadStatus,
      };
    });
  }

  async exportByTenant(tenantId: string, filters?: SubmissionFilters) {
    const submissions = await this.submissionRepo.exportByTenant(
      tenantId,
      filters,
    );
    return submissions
      .map((s: any) => {
        const totalQuestions = s.questionnaire.sections.reduce(
          (sum: number, sec: any) => sum + sec._count.questions,
          0,
        );
        const { sections: _sections, ...questionnaire } = s.questionnaire;
        return {
          ...s,
          questionnaire,
          totalQuestions,
          leadStatus: (s.leadStatus ?? "open") as SubmissionLeadStatus,
        };
      })
      .map((submission: any) => ({
        Respondent: submission.respondent?.email ?? "",
        Questionnaire: submission.questionnaire?.title ?? "",
        Answers: `${submission._count.answers} / ${submission.totalQuestions}`,
        Status:
          submission.leadStatus === "open"
            ? "Open"
            : submission.leadStatus === "in_progress"
              ? "In behandeling"
              : "Afgehandeld",
        Completed: submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleDateString()
          : "—",
      }));
  }

  async updateLeadStatus(
    submissionId: string,
    tenantId: string,
    leadStatus: SubmissionLeadStatus,
  ) {
    const submission = await this.submissionRepo.findOneWithDetails(submissionId);
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.questionnaire?.tenantId !== tenantId) {
      throw new NotFoundException("Submission not found");
    }

    const updated = await this.submissionRepo.update(submissionId, {
      leadStatus,
    } as any);

    return {
      id: updated.id,
      leadStatus: (updated as any).leadStatus ?? leadStatus,
    };
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

  async getPdfPreviewData(
    questionnaireId: string,
    answers: Record<string, string>,
  ) {
    const questionnaire = await this.questionnaireRepo.findOne(questionnaireId);
    if (!questionnaire || !(questionnaire as any).isPublished) {
      throw new NotFoundException("Questionnaire not found or not published");
    }

    const sections = ((questionnaire as any).sections ?? []).map(
      (section: any) => ({
        code: section.code,
        title: section.title,
        questions: (section.questions ?? []).map((question: any) => {
          const selectedOptionId = answers?.[question.id];
          const selectedOption =
            question.options?.find(
              (option: any) => option.id === selectedOptionId,
            ) ?? null;
          const allowedOptions = (question.options ?? [])
            .filter((option: any) => option.isAllowed === true)
            .map((option: any) => option.label);

          return {
            code: question.code,
            prompt: question.prompt,
            selectedOption: selectedOption
              ? {
                  id: selectedOption.id,
                  label: selectedOption.label,
                  groupLabel: selectedOption.groupLabel ?? null,
                  isAllowed: selectedOption.isAllowed ?? null,
                }
              : null,
            allowedOptions,
          };
        }),
      }),
    );

    let totalScored = 0;
    let totalGraded = 0;

    const sectionScores = sections.map((section: any) => {
      let scored = 0;
      let total = 0;
      for (const question of section.questions) {
        if ((question.allowedOptions?.length ?? 0) === 0) continue;
        total++;
        if (question.selectedOption?.isAllowed === true) scored++;
      }
      const percentage = total > 0 ? Math.round((scored / total) * 100) : 100;
      totalScored += scored;
      totalGraded += total;
      return {
        title: section.title,
        code: section.code,
        scored,
        total,
        percentage,
      };
    });

    const overallScore =
      totalGraded > 0 ? Math.round((totalScored / totalGraded) * 100) : 100;

    const notAllowedItems: Array<{
      sectionTitle: string;
      sectionCode: string | null;
      questionCode: string | null;
      questionPrompt: string;
      selectedLabel: string;
      allowedOptions: string[];
    }> = [];

    for (const section of sections) {
      for (const question of section.questions) {
        if (
          !question.selectedOption ||
          question.selectedOption.isAllowed !== false
        ) {
          continue;
        }
        const selectedLabel = question.selectedOption.groupLabel
          ? `${question.selectedOption.groupLabel}: ${question.selectedOption.label}`
          : question.selectedOption.label;
        notAllowedItems.push({
          sectionTitle: section.title,
          sectionCode: section.code,
          questionCode: question.code,
          questionPrompt: question.prompt,
          selectedLabel,
          allowedOptions: question.allowedOptions ?? [],
        });
      }
    }

    return {
      questionnaireTitle: (questionnaire as any).title,
      tenantName:
        (questionnaire as any).tenant?.name ?? (questionnaire as any).title,
      sections,
      results: {
        overallScore,
        totalScored,
        totalGraded,
        sectionScores,
        notAllowedItems,
      },
    };
  }
}
