import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Ensures a tenant user can only access resources within their own tenant.
 * Expects req.params.tenantId or req.body.tenantId to match the user's tenantId.
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Platform admins can access all tenants
    if (user.role === 'platform_admin') return true;

    // For tenant users, ensure they can only access their own tenant
    const tenantId = request.params.tenantId || request.body?.tenantId || request.query?.tenantId;
    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    return true;
  }
}
