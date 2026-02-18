import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IVerificationTokenRepository } from '../../../domain/repositories';
import { EmailVerificationTokenEntity } from '../../../domain/entities';

@Injectable()
export class PrismaVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<EmailVerificationTokenEntity>): Promise<EmailVerificationTokenEntity> {
    return this.prisma.emailVerificationToken.create({ data: data as any }) as any;
  }

  async findByHash(tokenHash: string): Promise<(EmailVerificationTokenEntity & { respondent: any }) | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { respondent: true },
    }) as any;
  }

  async update(id: string, data: Partial<EmailVerificationTokenEntity>): Promise<EmailVerificationTokenEntity> {
    return this.prisma.emailVerificationToken.update({ where: { id }, data: data as any }) as any;
  }

  async deleteByRespondent(respondentId: string): Promise<number> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: { respondentId },
    });
    return result.count;
  }

  async deleteExpired(tenantId: string): Promise<number> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        respondent: { tenantId },
        expiresAt: { lt: new Date() },
        status: { in: ['issued', 'expired'] },
      },
    });
    return result.count;
  }
}
