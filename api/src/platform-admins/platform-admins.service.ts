import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformAdminsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.platformAdmin.findMany({
      select: { id: true, email: true, displayName: true, role: { select: { id: true, name: true } }, isActive: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, role: { select: { id: true, name: true } }, isActive: true, createdAt: true },
    });
    if (!admin) throw new NotFoundException('Platform admin not found');
    return admin;
  }
}
