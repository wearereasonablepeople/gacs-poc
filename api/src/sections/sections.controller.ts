import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('questionnaires/:questionnaireId/sections')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class SectionsController {
  constructor(private service: SectionsService) {}

  @Get()
  findAll(@Param('questionnaireId') questionnaireId: string) {
    return this.service.findByQuestionnaire(questionnaireId);
  }

  @Post()
  create(
    @Param('questionnaireId') questionnaireId: string,
    @Body() body: { code?: string; title: string; description?: string },
  ) {
    return this.service.create(questionnaireId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { code?: string; title?: string; description?: string }) {
    return this.service.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('questionnaireId') questionnaireId: string, @Body() body: { orderedIds: string[] }) {
    return this.service.reorder(questionnaireId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
