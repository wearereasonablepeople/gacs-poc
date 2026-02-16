import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Matches the actual API response from findByTenant
interface SubmissionSummary {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  questionnaire: { title: string; slug: string };
  respondent: { email: string; isEmailVerified: boolean } | null;
  _count: { answers: number };
  totalQuestions: number;
}

// Matches the actual API response from findOne
interface SubmissionDetail {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  questionnaire: { id: string; title: string; slug: string };
  respondent: { id: string; email: string; isEmailVerified: boolean } | null;
  totalQuestions: number;
  answers: Array<{
    id: string;
    answeredAt: string;
    question: { id: string; code: string | null; prompt: string };
    selectedOption: { id: string; label: string; groupLabel: string | null };
  }>;
}

export default function SubmissionsPage() {
  const { user, isOwner } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: submissions, isLoading } = useQuery<SubmissionSummary[]>({
    queryKey: ['submissions', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/submissions`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  const { data: submissionDetail } = useQuery<SubmissionDetail>({
    queryKey: ['submission-detail', selectedSubmission],
    queryFn: async () => {
      const { data } = await api.get(`/submissions/${selectedSubmission}`);
      return data;
    },
    enabled: !!selectedSubmission && detailOpen,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/tenants/${user!.tenantId}/submissions/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submissions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  function openDetail(id: string) {
    setSelectedSubmission(id);
    setDetailOpen(true);
  }

  // Filter: only show submissions that have a respondent (i.e. email was submitted)
  const visibleSubmissions = submissions?.filter((s) => s.respondent !== null) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Submissions ({visibleSubmissions.length})
          </h2>
          <p className="text-muted-foreground">View and export questionnaire submissions</p>
        </div>
        {isOwner && (
          <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4" />
            {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        )}
      </div>

      {visibleSubmissions.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Respondent</TableHead>
                <TableHead>Questionnaire</TableHead>
                <TableHead>Answers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSubmissions.map((sub) => {
                const isComplete = sub.submittedAt && sub._count.answers >= sub.totalQuestions && sub.totalQuestions > 0;
                const status = isComplete ? 'completed' : 'in_progress';
                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(sub.id)}
                  >
                    <TableCell className="font-medium">
                      {sub.respondent?.email}
                      {sub.respondent?.isEmailVerified && (
                        <Badge variant="outline" className="ml-2 text-xs">Verified</Badge>
                      )}
                    </TableCell>
                    <TableCell>{sub.questionnaire.title}</TableCell>
                    <TableCell className="text-muted-foreground">{sub._count.answers} / {sub.totalQuestions}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                        {status === 'completed' ? 'Completed' : 'Incomplete'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">No submissions yet</p>
      )}

      {/* Submission detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Detail
            </DialogTitle>
            <DialogDescription>
              {submissionDetail?.respondent?.email} — {submissionDetail?.questionnaire?.title}
            </DialogDescription>
          </DialogHeader>

          {submissionDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Respondent:</span>
                  <p className="font-medium">{submissionDetail.respondent?.email ?? 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>
                    {(() => {
                      const isComplete = submissionDetail.submittedAt && submissionDetail.answers.length >= submissionDetail.totalQuestions && submissionDetail.totalQuestions > 0;
                      return (
                        <Badge variant={isComplete ? 'default' : 'secondary'}>
                          {isComplete ? 'Completed' : 'Incomplete'}
                        </Badge>
                      );
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <p className="font-medium">
                    {new Date(submissionDetail.startedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">
                    {submissionDetail.submittedAt
                      ? new Date(submissionDetail.submittedAt).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Answers ({submissionDetail.answers?.length ?? 0})</h4>
                {submissionDetail.answers && submissionDetail.answers.length > 0 ? (
                  submissionDetail.answers.map((answer) => (
                    <div key={answer.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">
                        {answer.question.code && (
                          <span className="text-primary mr-1">{answer.question.code}</span>
                        )}
                        {answer.question.prompt}
                      </p>
                      <p className="text-sm bg-muted rounded px-2 py-1 mt-1">
                        {answer.selectedOption.label}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No answers recorded</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
