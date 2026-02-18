import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionOptionsUseCase } from '../../app/usecase/questionoptions/questionoptions.usecase';
import { AuthenticatedGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';

@Controller('questions/:questionId/options')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class QuestionOptionsController {
  constructor(private readonly useCase: QuestionOptionsUseCase) {}

  @Get()
  findAll(@Param('questionId') questionId: string) {
    return this.useCase.findByQuestion(questionId);
  }

  @Post()
  create(
    @Param('questionId') questionId: string,
    @Body() body: { label: string; groupLabel?: string; isAllowed?: boolean | null },
  ) {
    return this.useCase.create(questionId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { label?: string; groupLabel?: string; isAllowed?: boolean | null }) {
    return this.useCase.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('questionId') questionId: string, @Body() body: { orderedIds: string[] }) {
    return this.useCase.reorder(questionId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.useCase.remove(id);
  }
}
