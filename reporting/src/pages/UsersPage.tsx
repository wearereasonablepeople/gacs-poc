import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Ban, Check, Trash2, Shield, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { inviteUserSchema, getFieldErrors, type FieldErrors, type InviteUserData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface TenantUser {
  id: string;
  email: string;
  displayName: string;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('tenant_admin');
  const [inviteErrors, setInviteErrors] = useState<FieldErrors<InviteUserData>>({});
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: users, isLoading } = useQuery<TenantUser[]>({
    queryKey: ['tenant-users', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/users`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/tenants/${user!.tenantId}/users`, {
        email: inviteEmail,
        displayName: inviteName,
        role: inviteRole === 'tenant_owner' ? 'owner' : 'admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('tenant_admin');
      setInviteErrors({});
    },
  });

  function handleInvite() {
    const result = getFieldErrors(inviteUserSchema, { email: inviteEmail, displayName: inviteName, role: inviteRole });
    if (!result.success) { setInviteErrors(result.errors); return; }
    setInviteErrors({});
    inviteMutation.mutate();
  }

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.patch(
        `/tenants/${user!.tenantId}/users/${userId}/${isActive ? 'activate' : 'deactivate'}`,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-users'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/tenants/${user!.tenantId}/users/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-users'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your tenant users and their access</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send an invitation to a new user to join your tenant</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); if (inviteErrors.email) setInviteErrors((p) => ({ ...p, email: undefined })); }}
                  className={inviteErrors.email ? 'border-destructive' : ''}
                />
                {inviteErrors.email && <p className="text-xs text-destructive">{inviteErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Display Name</Label>
                <Input
                  id="invite-name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => { setInviteName(e.target.value); if (inviteErrors.displayName) setInviteErrors((p) => ({ ...p, displayName: undefined })); }}
                  className={inviteErrors.displayName ? 'border-destructive' : ''}
                />
                {inviteErrors.displayName && <p className="text-xs text-destructive">{inviteErrors.displayName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant_admin">Admin</SelectItem>
                    <SelectItem value="tenant_owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Users</CardTitle>
          <CardDescription>{users?.length ?? 0} user(s) in your tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role.name === 'tenant_owner' ? 'default' : 'secondary'}>
                        <span className="flex items-center gap-1">
                          {u.role.name === 'tenant_owner' ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                          {u.role.name === 'tenant_owner' ? 'Owner' : 'Admin'}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'default' : 'destructive'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== user?.id && (
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    toggleActiveMutation.mutate({
                                      userId: u.id,
                                      isActive: !u.isActive,
                                    })
                                  }
                                >
                                  {u.isActive ? (
                                    <Ban className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveTarget({ id: u.id, name: u.displayName })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No users found</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeTarget?.name} from this tenant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) removeMutation.mutate(removeTarget.id);
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
