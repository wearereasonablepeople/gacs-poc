import { Module } from '@nestjs/common';
import { TenantUsersUseCase } from '../../app/usecase/tenantusers/tenantusers.usecase';
import { TenantUsersController } from '../../ui/controllers/tenantusers.controller';

@Module({
  providers: [TenantUsersUseCase],
  controllers: [TenantUsersController],
  exports: [TenantUsersUseCase],
})
export class TenantUsersFeatureModule {}
