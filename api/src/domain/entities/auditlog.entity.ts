export interface AuditLogEntity {
  id: string;
  tenantId: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}
