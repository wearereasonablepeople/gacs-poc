import { Module } from '@nestjs/common';
import { TenantsUseCase } from '../../app/usecase/tenants/tenants.usecase';
import { TenantsController } from '../../ui/controllers/tenants.controller';

@Module({
  providers: [TenantsUseCase],
  controllers: [TenantsController],
  exports: [TenantsUseCase],
})
export class TenantsFeatureModule {}
