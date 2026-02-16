import { Module } from '@nestjs/common';
import { RespondentsController } from './respondents.controller';
import { RespondentsService } from './respondents.service';

@Module({
  controllers: [RespondentsController],
  providers: [RespondentsService],
  exports: [RespondentsService],
})
export class RespondentsModule {}
