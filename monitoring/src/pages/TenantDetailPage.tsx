import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Building2,
  FileText,
  Users,
  Send,
  Plus,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { addTenantUserSchema, getFieldErrors, type FieldErrors, type AddTenantUserData } from '@/lib/schemas';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  _count?: {
    questionnaires?: number;
    users?: number;
    respondents?: number;
  };
}

interface TenantUser {
  id: string;
  email: string;
  displayName: string;
  role: { id: string; name: string };
  createdAt: string;
}

interface Questionnaire {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  _count?: {
    submissions?: number;
  };
}

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}`);
      return res.data.tenant ?? res.data;
    },
  });

  const { data: users = [] } = useQuery<TenantUser[]>({
    queryKey: ['tenant-users', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}/users`);
      return res.data.users ?? res.data;
    },
    enabled: !!id,
  });

  const { data: questionnaires = [] } = useQuery<Questionnaire[]>({
    queryKey: ['tenant-questionnaires', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}/questionnaires`);
      return res.data.questionnaires ?? res.data;
    },
    enabled: !!id,
  });

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/tenants">Tenants</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground">{tenant.slug}</p>
          </div>
          <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'} className="ml-2">
            {tenant.isActive !== false ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab tenant={tenant} usersCount={users.length} questionnaires={questionnaires} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersTab tenantId={tenant.id} users={users} queryClient={queryClient} />
        </TabsContent>

        {/* Questionnaires Tab */}
        <TabsContent value="questionnaires">
          <QuestionnairesTab questionnaires={questionnaires} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <SettingsTab tenant={tenant} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Overview Tab ---------- */
function OverviewTab({
  tenant,
  usersCount,
  questionnaires,
}: {
  tenant: Tenant;
  usersCount: number;
  questionnaires: Questionnaire[];
}) {
  const totalSubmissions = questionnaires.reduce(
    (sum, q) => sum + (q._count?.submissions ?? 0),
    0,
  );

  const stats = [
    { label: 'Questionnaires', value: tenant._count?.questionnaires ?? questionnaires.length, icon: FileText },
    { label: 'Users', value: tenant._count?.users ?? usersCount, icon: Users },
    { label: 'Respondents', value: tenant._count?.respondents ?? 0, icon: Users },
    { label: 'Submissions', value: totalSubmissions, icon: Send },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <span className="ml-2 font-medium">{tenant.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Slug:</span>
              <span className="ml-2 font-medium">{tenant.slug}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 font-medium">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2">
                <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'}>
                  {tenant.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </span>
            </div>
          </div>
          {tenant.branding && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {tenant.branding.primaryColor && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Primary:</span>
                    <div
                      className="h-5 w-5 rounded border"
                      style={{ backgroundColor: tenant.branding.primaryColor }}
                    />
                    <span className="font-mono text-xs">{tenant.branding.primaryColor}</span>
                  </div>
                )}
                {tenant.branding.secondaryColor && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Secondary:</span>
                    <div
                      className="h-5 w-5 rounded border"
                      style={{ backgroundColor: tenant.branding.secondaryColor }}
                    />
                    <span className="font-mono text-xs">{tenant.branding.secondaryColor}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Users Tab ---------- */
function UsersTab({
  tenantId,
  users,
  queryClient,
}: {
  tenantId: string;
  users: TenantUser[];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [error, setError] = useState('');
  const [userFieldErrors, setUserFieldErrors] = useState<FieldErrors<AddTenantUserData>>({});

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/tenants/${tenantId}/users`, {
        email: newEmail,
        password: newPassword,
        displayName: newDisplayName,
        role: newRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
      setDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setError('');
      setUserFieldErrors({});
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Failed to create user');
    },
  });

  function handleCreateUser() {
    const result = getFieldErrors(addTenantUserSchema, { displayName: newDisplayName, email: newEmail, password: newPassword, role: newRole });
    if (!result.success) { setUserFieldErrors(result.errors); return; }
    setUserFieldErrors({});
    createUserMutation.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>Manage tenant users</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Create a new user for this tenant</DialogDescription>
              </DialogHeader>
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={newDisplayName}
                    onChange={(e) => { setNewDisplayName(e.target.value); if (userFieldErrors.displayName) setUserFieldErrors((p) => ({ ...p, displayName: undefined })); }}
                    placeholder="John Doe"
                    className={userFieldErrors.displayName ? 'border-destructive' : ''}
                  />
                  {userFieldErrors.displayName && <p className="text-xs text-destructive">{userFieldErrors.displayName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); if (userFieldErrors.email) setUserFieldErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="user@example.com"
                    className={userFieldErrors.email ? 'border-destructive' : ''}
                  />
                  {userFieldErrors.email && <p className="text-xs text-destructive">{userFieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (userFieldErrors.password) setUserFieldErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="Minimum 8 characters"
                    className={userFieldErrors.password ? 'border-destructive' : ''}
                  />
                  {userFieldErrors.password && <p className="text-xs text-destructive">{userFieldErrors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={newRole}
                    onChange={(e) => { setNewRole(e.target.value); if (userFieldErrors.role) setUserFieldErrors((p) => ({ ...p, role: undefined })); }}
                    placeholder="admin"
                    className={userFieldErrors.role ? 'border-destructive' : ''}
                  />
                  {userFieldErrors.role && <p className="text-xs text-destructive">{userFieldErrors.role}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-50" />
            <p>No users yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role.name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Questionnaires Tab ---------- */
function QuestionnairesTab({ questionnaires }: { questionnaires: Questionnaire[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Questionnaires</CardTitle>
        <CardDescription>All questionnaires for this tenant</CardDescription>
      </CardHeader>
      <CardContent>
        {questionnaires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-50" />
            <p>No questionnaires yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell className="text-muted-foreground">{q.slug}</TableCell>
                  <TableCell>
                    <Badge variant={q.isPublished ? 'success' : 'secondary'}>
                      {q.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{q._count?.submissions ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Settings Tab ---------- */
function SettingsTab({
  tenant,
  queryClient,
}: {
  tenant: Tenant;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [primaryColor, setPrimaryColor] = useState(tenant.branding?.primaryColor ?? '#1e40af');
  const [secondaryColor, setSecondaryColor] = useState(tenant.branding?.secondaryColor ?? '#e2e8f0');
  const [logoUrl, setLogoUrl] = useState(tenant.branding?.logoUrl ?? '');
  const [faviconUrl, setFaviconUrl] = useState(tenant.branding?.faviconUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateBrandingMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/tenants/${tenant.id}`, {
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || undefined,
          faviconUrl: faviconUrl || undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] });
      setSuccess('Branding updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Failed to update branding');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/tenants/${tenant.id}`, {
        isActive: !tenant.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>Customize the tenant's visual identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-500">{success}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => updateBrandingMutation.mutate()}
              disabled={updateBrandingMutation.isPending}
            >
              {updateBrandingMutation.isPending ? 'Saving...' : 'Save Branding'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            {tenant.isActive !== false
              ? 'Deactivate this tenant to prevent access'
              : 'Reactivate this tenant to restore access'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={tenant.isActive !== false}
                onCheckedChange={() => toggleActiveMutation.mutate()}
                disabled={toggleActiveMutation.isPending}
              />
              <span className="text-sm font-medium">
                Tenant is {tenant.isActive !== false ? 'active' : 'inactive'}
              </span>
            </div>
            <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'}>
              {tenant.isActive !== false ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
