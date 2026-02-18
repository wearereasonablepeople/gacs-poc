import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY, IRoleRepository } from '../../../domain/repositories';

@Injectable()
export class RolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
  ) {}

  async findAll() {
    return this.roleRepo.findAll();
  }

  async findByName(name: string) {
    return this.roleRepo.findByName(name);
  }
}
