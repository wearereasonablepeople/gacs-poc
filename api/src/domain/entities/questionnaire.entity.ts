import { SectionEntity } from "./section.entity";
import { TenantEntity } from "./tenant.entity";

export interface QuestionnaireEntity {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  sections?: SectionEntity[];
  tenant?: TenantEntity;
  _count?: { sections?: number; submissions?: number };
}
