import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLATFORM_ADMIN_REPOSITORY, IPlatformAdminRepository } from '../../../domain/repositories';

@Injectable()
export class PlatformAdminsUseCase {
  constructor(
    @Inject(PLATFORM_ADMIN_REPOSITORY) private readonly adminRepo: IPlatformAdminRepository,
  ) {}

  async findAll() {
    return this.adminRepo.findAll();
  }

  async findOne(id: string) {
    const admin = await this.adminRepo.findOne(id);
    if (!admin) throw new NotFoundException('Platform admin not found');
    return admin;
  }
}
