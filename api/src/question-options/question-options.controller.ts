import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionOptionsService } from './question-options.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('questions/:questionId/options')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class QuestionOptionsController {
  constructor(private service: QuestionOptionsService) {}

  @Get()
  findAll(@Param('questionId') questionId: string) {
    return this.service.findByQuestion(questionId);
  }

  @Post()
  create(
    @Param('questionId') questionId: string,
    @Body() body: { label: string; groupLabel?: string },
  ) {
    return this.service.create(questionId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { label?: string; groupLabel?: string }) {
    return this.service.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('questionId') questionId: string, @Body() body: { orderedIds: string[] }) {
    return this.service.reorder(questionId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
