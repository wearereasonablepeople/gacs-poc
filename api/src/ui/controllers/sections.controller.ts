import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SectionsUseCase } from '../../app/usecase/sections/sections.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller('questionnaires/:questionnaireId/sections')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class SectionsController {
  constructor(private readonly useCase: SectionsUseCase) {}

  @Get()
  findAll(@Param('questionnaireId') questionnaireId: string) {
    return this.useCase.findByQuestionnaire(questionnaireId);
  }

  @Post()
  create(
    @Param('questionnaireId') questionnaireId: string,
    @Body() body: { code?: string; title: string; description?: string; icon?: string; imageUrl?: string; imageScale?: number },
  ) {
    return this.useCase.create(questionnaireId, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { code?: string; title?: string; description?: string; icon?: string; imageUrl?: string; imageScale?: number },
  ) {
    return this.useCase.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('questionnaireId') questionnaireId: string, @Body() body: { orderedIds: string[] }) {
    return this.useCase.reorder(questionnaireId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.useCase.remove(id);
  }
}
