export interface TenantEntity {
  id: string;
  slug: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  headerTextColor: string | null;
  subtextColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  isActive: boolean;
  retentionDays: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
