import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Building2 } from 'lucide-react';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    questionnaires?: number;
    users?: number;
    respondents?: number;
  };
  questionnairesCount?: number;
  usersCount?: number;
  respondentsCount?: number;
}

export function TenantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data.tenants ?? res.data;
    },
  });

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()),
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage all tenants on the platform
          </p>
        </div>
        <Button asChild>
          <Link to="/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Tenants</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3 opacity-50" />
              <p>{search ? 'No tenants match your search' : 'No tenants yet'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Questionnaires</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Respondents</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'}>
                        {tenant.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant._count?.questionnaires ?? tenant.questionnairesCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant._count?.users ?? tenant.usersCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant._count?.respondents ?? tenant.respondentsCount ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
