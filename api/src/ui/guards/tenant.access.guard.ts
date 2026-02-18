import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    if (user.role === 'platform_admin') return true;

    const tenantId = request.params.tenantId || request.body?.tenantId || request.query?.tenantId;
    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    return true;
  }
}
