import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  IQuestionnaireRepository,
  QUESTIONNAIRE_REPOSITORY,
} from "../../../domain/repositories";

@Injectable()
export class QuestionnairesUseCase {
  constructor(
    @Inject(QUESTIONNAIRE_REPOSITORY)
    private readonly questionnaireRepo: IQuestionnaireRepository,
  ) {}

  async findByTenant(tenantId: string) {
    return this.questionnaireRepo.findByTenant(tenantId);
  }

  async findOne(id: string) {
    const q = await this.questionnaireRepo.findOne(id);
    if (!q) throw new NotFoundException("Questionnaire not found");
    return q;
  }

  async findPublished(tenantSlug: string, questionnaireSlug: string) {
    const q = await this.questionnaireRepo.findPublished(
      tenantSlug,
      questionnaireSlug,
    );
    if (!q || !(q as any).isPublished)
      throw new NotFoundException("Questionnaire not found or not published");
    return q;
  }

  async create(
    tenantId: string,
    createdById: string,
    dto: { title: string; slug: string; description?: string },
  ) {
    const existing = await this.questionnaireRepo.findByTenantAndSlug(
      tenantId,
      dto.slug,
    );
    if (existing)
      throw new ConflictException(
        "A questionnaire with this slug already exists",
      );
    return this.questionnaireRepo.create({
      tenantId,
      createdById,
      ...dto,
    } as any);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.questionnaireRepo.update(id, dto);
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.questionnaireRepo.update(id, {
      isPublished: true,
      publishedAt: new Date(),
    } as any);
  }

  async unpublish(id: string) {
    await this.findOne(id);
    return this.questionnaireRepo.update(id, { isPublished: false } as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.questionnaireRepo.remove(id);
    return { message: "Questionnaire deleted" };
  }
}
