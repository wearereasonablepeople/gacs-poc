import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Matches the actual API response from findByTenant
interface SubmissionSummary {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  leadStatus: "open" | "in_progress" | "closed";
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
  leadStatus: "open" | "in_progress" | "closed";
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

interface SubmissionFilters {
  email: string;
  questionnaire: string;
  status: "all" | "open" | "in_progress" | "closed";
  createdFrom: string;
  createdTo: string;
}

function buildSubmissionQueryParams(filters: SubmissionFilters) {
  return {
    ...(filters.email ? { email: filters.email } : {}),
    ...(filters.questionnaire ? { questionnaire: filters.questionnaire } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.createdFrom ? { createdFrom: filters.createdFrom } : {}),
    ...(filters.createdTo ? { createdTo: filters.createdTo } : {}),
  };
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}

function downloadBlobFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function SubmissionsPage() {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState<SubmissionFilters>({
    email: "",
    questionnaire: "",
    status: "all",
    createdFrom: "",
    createdTo: "",
  });
  const debouncedFilters = useDebouncedValue(filters, 350);
  const submissionIdFromQuery = searchParams.get("submissionId");

  useEffect(() => {
    if (!submissionIdFromQuery) return;
    setSelectedSubmission(submissionIdFromQuery);
    setDetailOpen(true);
  }, [submissionIdFromQuery]);

  const {
    data: submissions,
    isLoading,
    isFetching: isRefetchingSubmissions,
  } = useQuery<SubmissionSummary[]>({
    queryKey: ["submissions", user?.tenantId, debouncedFilters],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/submissions`, {
        params: buildSubmissionQueryParams(debouncedFilters),
      });
      return data;
    },
    enabled: !!user?.tenantId,
    placeholderData: (previousData) => previousData,
  });

  const { data: submissionDetail } = useQuery<SubmissionDetail>({
    queryKey: ["submission-detail", selectedSubmission],
    queryFn: async () => {
      const { data } = await api.get(`/submissions/${selectedSubmission}`);
      return data;
    },
    enabled: !!selectedSubmission && detailOpen,
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({
      submissionId,
      leadStatus,
    }: {
      submissionId: string;
      leadStatus: "open" | "in_progress" | "closed";
    }) => {
      await api.patch(`/submissions/${submissionId}/lead-status`, { leadStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", user?.tenantId] });
      queryClient.invalidateQueries({
        queryKey: ["submission-detail", selectedSubmission],
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/tenants/${user!.tenantId}/submissions/export`,
        {
          params: buildSubmissionQueryParams(debouncedFilters),
          responseType: "blob",
        },
      );
      downloadBlobFile(
        new Blob([response.data]),
        `submissions-${new Date().toISOString().split("T")[0]}.csv`,
      );
    },
  });

  function openDetail(id: string) {
    setSelectedSubmission(id);
    setDetailOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set("submissionId", id);
    setSearchParams(next, { replace: true });
  }

  function handleDetailOpenChange(open: boolean) {
    setDetailOpen(open);
    if (!open) {
      const next = new URLSearchParams(searchParams);
      next.delete("submissionId");
      setSearchParams(next, { replace: true });
    }
  }

  const visibleSubmissions = submissions ?? [];

  if (isLoading && !submissions) {
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
          <h2 className="text-2xl font-bold tracking-tight">
            Submissions ({visibleSubmissions.length})
          </h2>
          <p className="text-muted-foreground">
            View and export questionnaire submissions
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
        )}
      </div>

      <div className="rounded-md border p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Filter by email"
            value={filters.email}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <Input
            placeholder="Filter by questionnaire"
            value={filters.questionnaire}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                questionnaire: event.target.value,
              }))
            }
          />
          <Select
            value={filters.status}
            onValueChange={(value: "all" | "open" | "in_progress" | "closed") =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In behandeling</SelectItem>
              <SelectItem value="closed">Afgehandeld</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.createdFrom}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                createdFrom: event.target.value,
              }))
            }
          />
          <Input
            type="date"
            value={filters.createdTo}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                createdTo: event.target.value,
              }))
            }
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Filter inputs are debounced and only refresh the table.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({
                email: "",
                questionnaire: "",
                status: "all",
                createdFrom: "",
                createdTo: "",
              })
            }
          >
            Clear filters
          </Button>
        </div>
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
              {isRefetchingSubmissions ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Updating table...
                  </TableCell>
                </TableRow>
              ) : null}
              {visibleSubmissions.map((sub) => {
                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(sub.id)}
                  >
                    <TableCell className="font-medium">
                      {sub.respondent?.email}
                      {sub.respondent?.isEmailVerified && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{sub.questionnaire.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub._count.answers} / {sub.totalQuestions}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Select
                          value={sub.leadStatus}
                          onValueChange={(value: "open" | "in_progress" | "closed") =>
                            updateLeadStatusMutation.mutate({
                              submissionId: sub.id,
                              leadStatus: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In behandeling</SelectItem>
                            <SelectItem value="closed">Afgehandeld</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No submissions yet
        </p>
      )}

      {/* Submission detail dialog */}
      <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Detail
            </DialogTitle>
            <DialogDescription>
              {submissionDetail?.respondent?.email} —{" "}
              {submissionDetail?.questionnaire?.title}
            </DialogDescription>
          </DialogHeader>

          {submissionDetail ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Respondent:</span>
                    <p className="font-medium">
                      {submissionDetail.respondent?.email ?? "Anonymous"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Select
                        value={submissionDetail.leadStatus}
                        onValueChange={(value: "open" | "in_progress" | "closed") =>
                          updateLeadStatusMutation.mutate({
                            submissionId: submissionDetail.id,
                            leadStatus: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[170px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In behandeling</SelectItem>
                          <SelectItem value="closed">Afgehandeld</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        ? new Date(
                            submissionDetail.submittedAt,
                          ).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Answers ({submissionDetail.answers?.length ?? 0})
                  </h4>
                  {submissionDetail.answers &&
                  submissionDetail.answers.length > 0 ? (
                    submissionDetail.answers.map((answer) => (
                      <div key={answer.id} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">
                          {answer.question.code && (
                            <span className="text-primary mr-1">
                              {answer.question.code}
                            </span>
                          )}
                          {answer.question.prompt}
                        </p>
                        <p className="text-sm bg-muted rounded px-2 py-1 mt-1">
                          {answer.selectedOption.label}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No answers recorded
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
