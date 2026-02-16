import { Module } from '@nestjs/common';
import { PlatformAdminsController } from './platform-admins.controller';
import { PlatformAdminsService } from './platform-admins.service';

@Module({
  controllers: [PlatformAdminsController],
  providers: [PlatformAdminsService],
})
export class PlatformAdminsModule {}
