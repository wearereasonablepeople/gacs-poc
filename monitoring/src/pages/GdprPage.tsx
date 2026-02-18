import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Shield,
  Trash2,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: {
    respondents?: number;
    questionnaires?: number;
  };
  respondentsCount?: number;
}

export function GdprPage() {
  const queryClient = useQueryClient();
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data.tenants ?? res.data;
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/gdpr/purge');
      return res.data;
    },
    onSuccess: (data) => {
      setPurgeResult(
        data.message ?? `Purge completed. ${data.purgedCount ?? 0} expired records removed.`,
      );
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setPurgeDialogOpen(false);
    },
    onError: (err: any) => {
      setPurgeResult(`Error: ${err?.response?.data?.error ?? err?.message ?? 'Purge failed'}`);
    },
  });

  const totalRespondents = tenants.reduce(
    (sum, t) => sum + (t._count?.respondents ?? t.respondentsCount ?? 0),
    0,
  );

  const retentionPolicies = [
    {
      category: 'Submission Data',
      period: '24 months',
      description: 'Questionnaire responses and metadata',
      icon: FileText,
    },
    {
      category: 'Respondent PII',
      period: '12 months after last activity',
      description: 'Email, name, and contact information',
      icon: Shield,
    },
    {
      category: 'Session Tokens',
      period: '30 days',
      description: 'Authentication sessions and cookies',
      icon: Clock,
    },
    {
      category: 'Audit Logs',
      period: '36 months',
      description: 'Administrative action logs',
      icon: Database,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GDPR Administration</h1>
        <p className="text-muted-foreground">
          Data protection, retention policies, and compliance management
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Respondents
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRespondents}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tenants
            </CardTitle>
            <Database className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter((t) => t.isActive !== false).length}
            </div>
            <p className="text-xs text-muted-foreground">Processing personal data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data Purge
            </CardTitle>
            <Trash2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <Dialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Purge Expired Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirm Data Purge
                  </DialogTitle>
                  <DialogDescription>
                    This will permanently delete all data that has exceeded its retention period.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-md bg-destructive/10 p-4 text-sm">
                  <p className="font-medium text-destructive">This will remove:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>- Expired respondent PII (older than retention period)</li>
                    <li>- Orphaned submission data</li>
                    <li>- Expired session records</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPurgeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => purgeMutation.mutate()}
                    disabled={purgeMutation.isPending}
                  >
                    {purgeMutation.isPending ? 'Purging...' : 'Confirm Purge'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Purge result notification */}
      {purgeResult && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            purgeResult.startsWith('Error')
              ? 'bg-destructive/10 text-destructive'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {purgeResult.startsWith('Error') ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {purgeResult}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => setPurgeResult(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Data Retention Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Retention Policies</CardTitle>
          <CardDescription>
            How long different data categories are kept before automatic purge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {retentionPolicies.map((policy) => (
              <div
                key={policy.category}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <div className="rounded-md bg-primary/10 p-2">
                  <policy.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{policy.category}</p>
                    <Badge variant="outline">{policy.period}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{policy.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data overview per tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Overview by Tenant</CardTitle>
          <CardDescription>
            Personal data distribution across tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Database className="h-10 w-10 mb-3 opacity-50" />
              <p>No tenants</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Respondents</TableHead>
                  <TableHead className="text-right">Questionnaires</TableHead>
                  <TableHead>Data Processing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'}>
                        {tenant.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant._count?.respondents ?? tenant.respondentsCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant._count?.questionnaires ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive !== false ? 'success' : 'secondary'}>
                        {tenant.isActive !== false ? 'Active' : 'Suspended'}
                      </Badge>
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
