import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { QuestionnairesUseCase } from "../../app/usecase/questionnaires/questionnaires.usecase";
import { CurrentUser, Roles } from "../decorators";
import { CreateQuestionnaireDto } from "../dto";
import { AuthenticatedGuard, RolesGuard } from "../guards";

@Controller()
export class QuestionnairesController {
  constructor(private readonly useCase: QuestionnairesUseCase) {}

  @Get("public/:tenantSlug/:questionnaireSlug")
  findPublished(
    @Param("tenantSlug") tenantSlug: string,
    @Param("questionnaireSlug") questionnaireSlug: string,
  ) {
    return this.useCase.findPublished(tenantSlug, questionnaireSlug);
  }

  @Get("tenants/:tenantId/questionnaires")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("platform_admin", "tenant_owner", "tenant_admin")
  findByTenant(@Param("tenantId") tenantId: string) {
    return this.useCase.findByTenant(tenantId);
  }

  @Get("questionnaires/:id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("platform_admin", "tenant_owner", "tenant_admin")
  findOne(@Param("id") id: string) {
    return this.useCase.findOne(id);
  }

  @Post("tenants/:tenantId/questionnaires")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner", "tenant_admin")
  create(
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateQuestionnaireDto,
    @CurrentUser() user: any,
  ) {
    return this.useCase.create(tenantId, user.id, dto);
  }

  @Patch("questionnaires/:id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner", "tenant_admin")
  update(
    @Param("id") id: string,
    @Body() dto: Partial<CreateQuestionnaireDto>,
  ) {
    return this.useCase.update(id, dto);
  }

  @Patch("questionnaires/:id/publish")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner")
  publish(@Param("id") id: string) {
    return this.useCase.publish(id);
  }

  @Patch("questionnaires/:id/unpublish")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner")
  unpublish(@Param("id") id: string) {
    return this.useCase.unpublish(id);
  }

  @Delete("questionnaires/:id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles("tenant_owner")
  remove(@Param("id") id: string) {
    return this.useCase.remove(id);
  }
}
