import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IRoleRepository } from '../../../domain/repositories';
import { RoleEntity } from '../../../domain/entities';

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleEntity[]> {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }
}
