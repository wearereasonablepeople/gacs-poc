import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionsUseCase } from '../../app/usecase/questions/questions.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller('sections/:sectionId/questions')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class QuestionsController {
  constructor(private readonly useCase: QuestionsUseCase) {}

  @Get()
  findAll(@Param('sectionId') sectionId: string) {
    return this.useCase.findBySection(sectionId);
  }

  @Post()
  create(
    @Param('sectionId') sectionId: string,
    @Body() body: { code?: string; prompt: string; helpText?: string; isRequired?: boolean },
  ) {
    return this.useCase.create(sectionId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { code?: string; prompt?: string; helpText?: string; isRequired?: boolean }) {
    return this.useCase.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('sectionId') sectionId: string, @Body() body: { orderedIds: string[] }) {
    return this.useCase.reorder(sectionId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.useCase.remove(id);
  }
}
