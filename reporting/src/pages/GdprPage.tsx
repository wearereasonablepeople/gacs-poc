import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Download,
  Trash2,
  Search,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  User,
  History,
  Save,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Respondent {
  id: string;
  email: string;
  name: string | null;
  submissionCount: number;
  consentGiven: boolean;
  consentDate: string | null;
  lastActivityAt: string;
  createdAt: string;
}

interface DataRetention {
  retentionPeriodDays: number;
  autoDeleteEnabled: boolean;
  lastPurgeAt: string | null;
  recordsScheduledForDeletion: number;
}

interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  view_submissions: 'Viewed submissions',
  gdpr_export_respondent: 'Exported respondent data',
  gdpr_delete_respondent: 'Deleted respondent data',
  gdpr_export_all: 'Exported all tenant data',
  gdpr_update_retention: 'Updated retention settings',
  gdpr_erasure_self_service: 'Self-service erasure request',
  gdpr_auto_purge: 'Automatic data purge',
};

export default function GdprPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [respondentToDelete, setRespondentToDelete] = useState<Respondent | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [retentionInput, setRetentionInput] = useState<string>('');

  // ── Queries ─────────────────────────────────
  const { data: respondents, isLoading: loadingRespondents } = useQuery<Respondent[]>({
    queryKey: ['gdpr-respondents', user?.tenantId, searchEmail],
    queryFn: async () => {
      const params = searchEmail ? `?search=${encodeURIComponent(searchEmail)}` : '';
      const { data } = await api.get(`/tenants/${user!.tenantId}/respondents${params}`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  const { data: retention, isLoading: loadingRetention } = useQuery<DataRetention>({
    queryKey: ['gdpr-retention', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/gdpr/retention`);
      return data;
    },
    enabled: !!user?.tenantId,
    onSuccess: (data) => {
      if (!retentionInput) setRetentionInput(String(data.retentionPeriodDays));
    },
  } as any);

  const { data: auditData, isLoading: loadingAudit } = useQuery<{ logs: AuditLogEntry[]; total: number }>({
    queryKey: ['gdpr-audit', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/gdpr/audit-log?limit=100`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  // ── Mutations ───────────────────────────────
  const exportDataMutation = useMutation({
    mutationFn: async (respondentId: string) => {
      setExportingId(respondentId);
      const response = await api.get(`/gdpr/respondents/${respondentId}/export`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `respondent-data-${respondentId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSettled: () => setExportingId(null),
  });

  const deleteDataMutation = useMutation({
    mutationFn: async (respondentId: string) => {
      await api.delete(`/gdpr/respondents/${respondentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-respondents'] });
      queryClient.invalidateQueries({ queryKey: ['gdpr-audit'] });
      setDeleteConfirmOpen(false);
      setRespondentToDelete(null);
    },
  });

  const exportAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/tenants/${user!.tenantId}/gdpr/export-all`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tenant-data-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const updateRetentionMutation = useMutation({
    mutationFn: async (days: number) => {
      await api.put(`/tenants/${user!.tenantId}/gdpr/retention`, { retentionDays: days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-retention'] });
      queryClient.invalidateQueries({ queryKey: ['gdpr-audit'] });
    },
  });

  function confirmDelete(respondent: Respondent) {
    setRespondentToDelete(respondent);
    setDeleteConfirmOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GDPR Management</h2>
          <p className="text-muted-foreground">Data protection, privacy, and compliance tools</p>
        </div>
        <Button onClick={() => exportAllMutation.mutate()} disabled={exportAllMutation.isPending}>
          <Download className="h-4 w-4" />
          {exportAllMutation.isPending ? 'Exporting...' : 'Export All Data'}
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {retention?.retentionPeriodDays ?? '—'} days
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-delete: {retention?.autoDeleteEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Deletions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {retention?.recordsScheduledForDeletion ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Respondents beyond retention period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Respondents</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{respondents?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Tracked respondents</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="respondents">
        <TabsList>
          <TabsTrigger value="respondents">Respondents</TabsTrigger>
          <TabsTrigger value="retention">Retention Settings</TabsTrigger>
          <TabsTrigger value="consent">Consent Tracking</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
        </TabsList>

        {/* Respondents tab */}
        <TabsContent value="respondents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Respondent Data Management
              </CardTitle>
              <CardDescription>
                Search for respondents to export or erase their data (Right to access / Right to erasure)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loadingRespondents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : respondents && respondents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {respondents.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.email}</TableCell>
                        <TableCell>{r.submissionCount}</TableCell>
                        <TableCell>
                          {r.consentGiven ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Given
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Not given
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(r.lastActivityAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => exportDataMutation.mutate(r.id)}
                                    disabled={exportingId === r.id}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Export data</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDelete(r)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete data (Right to erasure)</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  {searchEmail ? 'No respondents matching your search' : 'No respondents found'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Settings tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention Policy
              </CardTitle>
              <CardDescription>
                Configure how long respondent data is retained. Data older than the retention period
                will be eligible for automatic deletion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retention-days">Retention period (days)</Label>
                <div className="flex gap-2">
                  <Input
                    id="retention-days"
                    type="number"
                    min={30}
                    max={3650}
                    value={retentionInput || (retention?.retentionPeriodDays ?? '')}
                    onChange={(e) => setRetentionInput(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button
                    onClick={() => updateRetentionMutation.mutate(parseInt(retentionInput, 10))}
                    disabled={updateRetentionMutation.isPending || !retentionInput}
                  >
                    {updateRetentionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 30 days, maximum 10 years (3650 days). Currently set to{' '}
                  <strong>{retention?.retentionPeriodDays ?? '—'} days</strong>.
                </p>
              </div>

              <Separator />

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold text-sm">Current status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Records beyond retention:</span>
                    <p className="font-medium">{retention?.recordsScheduledForDeletion ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto-delete:</span>
                    <p className="font-medium">{retention?.autoDeleteEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent Tracking tab */}
        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Consent Tracking
              </CardTitle>
              <CardDescription>
                Overview of consent status for all respondents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {respondents && respondents.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {respondents.filter((r) => r.consentGiven).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Consent Given</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-2xl font-bold text-orange-500">
                        {respondents.filter((r) => !r.consentGiven).length}
                      </p>
                      <p className="text-sm text-muted-foreground">No Consent</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Consent Status</TableHead>
                        <TableHead>Consent Date</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {respondents.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.email}</TableCell>
                          <TableCell>
                            {r.consentGiven ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Consent Given
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                No Consent
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.consentDate ? new Date(r.consentDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No respondents found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Track who accessed, exported, or deleted respondent data. This log is maintained
                for GDPR accountability (Article 5(2)).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : auditData && auditData.logs.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {auditData.logs.length} of {auditData.total} entries
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.userEmail || 'System'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.resource}
                            {log.resourceId && (
                              <span className="text-xs ml-1">({log.resourceId.slice(0, 8)}…)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                            {log.details || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No audit log entries yet. Actions will be logged as users interact with respondent data.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Privacy Policy Notice
              </CardTitle>
              <CardDescription>
                Information about how data is collected and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">Data Collection</h4>
                <p className="text-sm text-muted-foreground">
                  This platform collects respondent data through questionnaires. Data collected includes
                  email addresses and questionnaire responses. All data is processed in accordance
                  with GDPR/AVG regulations.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">Lawful Basis</h4>
                <p className="text-sm text-muted-foreground">
                  Data processing is based on explicit consent (Article 6(1)(a) GDPR) given by
                  respondents when submitting their questionnaire. Consent is recorded with a timestamp
                  and can be tracked in the Consent Tracking tab.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">Data Storage & Retention</h4>
                <p className="text-sm text-muted-foreground">
                  Data is securely stored and retained for the configured retention period
                  ({retention?.retentionPeriodDays ?? '—'} days). After this period, data may be
                  automatically purged. Retention settings can be configured in the Retention Settings tab.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">Data Subject Rights</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Right to Access (Art. 15):</strong> Export respondent data using the export function</li>
                  <li><strong>Right to Erasure (Art. 17):</strong> Delete respondent data using the delete function, or respondents can self-service via the erasure request page</li>
                  <li><strong>Right to Portability (Art. 20):</strong> Data can be exported in JSON format</li>
                  <li><strong>Right to Rectification (Art. 16):</strong> Contact the tenant administrator to correct data</li>
                </ul>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold">Transparency</h4>
                <p className="text-sm text-muted-foreground">
                  Respondents are informed at the point of data collection that their email and answers will
                  be processed by the organization for analysis and reporting. They are informed of their
                  GDPR rights and can submit erasure requests through a dedicated page.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all personal data associated
              with this respondent. Submissions will be anonymized (answers retained for analytics).
            </DialogDescription>
          </DialogHeader>

          {respondentToDelete && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm">
                <strong>Email:</strong> {respondentToDelete.email}
              </p>
              <p className="text-sm">
                <strong>Submissions:</strong> {respondentToDelete.submissionCount}
              </p>
              <p className="text-sm">
                <strong>Consent:</strong> {respondentToDelete.consentGiven ? 'Given' : 'Not given'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Email, verification tokens, and respondent identity will be permanently removed.
                Submission answers will be anonymized (no longer linked to this email).
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => respondentToDelete && deleteDataMutation.mutate(respondentToDelete.id)}
              disabled={deleteDataMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteDataMutation.isPending ? 'Deleting...' : 'Delete All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
