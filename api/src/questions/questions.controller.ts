import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sections/:sectionId/questions')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('tenant_owner', 'tenant_admin')
export class QuestionsController {
  constructor(private service: QuestionsService) {}

  @Get()
  findAll(@Param('sectionId') sectionId: string) {
    return this.service.findBySection(sectionId);
  }

  @Post()
  create(
    @Param('sectionId') sectionId: string,
    @Body() body: { code?: string; prompt: string; helpText?: string; isRequired?: boolean },
  ) {
    return this.service.create(sectionId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { code?: string; prompt?: string; helpText?: string; isRequired?: boolean }) {
    return this.service.update(id, body);
  }

  @Post('reorder')
  reorder(@Param('sectionId') sectionId: string, @Body() body: { orderedIds: string[] }) {
    return this.service.reorder(sectionId, body.orderedIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
