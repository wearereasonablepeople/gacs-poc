import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IPlatformAdminRepository } from '../../../domain/repositories';
import { PlatformAdminEntity } from '../../../domain/entities';

@Injectable()
export class PrismaPlatformAdminRepository implements IPlatformAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PlatformAdminEntity[]> {
    return this.prisma.platformAdmin.findMany({
      select: {
        id: true, email: true, displayName: true,
        role: { select: { id: true, name: true } },
        isActive: true, createdAt: true, roleId: true, updatedAt: true,
      },
    }) as any;
  }

  async findOne(id: string): Promise<PlatformAdminEntity | null> {
    return this.prisma.platformAdmin.findUnique({
      where: { id },
      select: {
        id: true, email: true, displayName: true,
        role: { select: { id: true, name: true } },
        isActive: true, createdAt: true, roleId: true, updatedAt: true,
      },
    }) as any;
  }

  async findByEmail(email: string): Promise<(PlatformAdminEntity & { role: { name: string } }) | null> {
    return this.prisma.platformAdmin.findUnique({
      where: { email },
      include: { role: true },
    }) as any;
  }
}
