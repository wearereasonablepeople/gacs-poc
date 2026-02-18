import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { createQuestionnaireSchema, getFieldErrors, type FieldErrors, type CreateQuestionnaireData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';

interface Questionnaire {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  _count?: { submissions: number };
  createdAt: string;
}

export default function QuestionnairesPage() {
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createErrors, setCreateErrors] = useState<FieldErrors<CreateQuestionnaireData>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: questionnaires, isLoading } = useQuery<Questionnaire[]>({
    queryKey: ['questionnaires', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/questionnaires`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/tenants/${user!.tenantId}/questionnaires`, {
        title: newTitle,
        slug: newSlug,
        description: newDescription,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setCreateOpen(false);
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      setCreateErrors({});
    },
  });

  function handleCreate() {
    const result = getFieldErrors(createQuestionnaireSchema, { title: newTitle, slug: newSlug, description: newDescription || undefined });
    if (!result.success) {
      setCreateErrors(result.errors);
      return;
    }
    setCreateErrors({});
    createMutation.mutate();
  }

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      await api.patch(
        isPublished ? `/questionnaires/${id}/publish` : `/questionnaires/${id}/unpublish`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/questionnaires/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
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
          <h2 className="text-2xl font-bold tracking-tight">
            Questionnaires ({questionnaires?.length ?? 0})
          </h2>
          <p className="text-muted-foreground">Manage your questionnaires and their content</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Questionnaire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Questionnaire</DialogTitle>
              <DialogDescription>Add a new questionnaire to your tenant</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Customer Satisfaction Survey"
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value); if (createErrors.title) setCreateErrors((p) => ({ ...p, title: undefined })); }}
                  className={createErrors.title ? 'border-destructive' : ''}
                />
                {createErrors.title && <p className="text-xs text-destructive">{createErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="customer-satisfaction"
                  value={newSlug}
                  onChange={(e) => { setNewSlug(e.target.value); if (createErrors.slug) setCreateErrors((p) => ({ ...p, slug: undefined })); }}
                  className={createErrors.slug ? 'border-destructive' : ''}
                />
                {createErrors.slug && <p className="text-xs text-destructive">{createErrors.slug}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="A survey to gather customer feedback"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {questionnaires && questionnaires.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Created</TableHead>
                {isOwner && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((q) => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/questionnaires/${q.id}`)}
                >
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{q.slug}</TableCell>
                  <TableCell>
                    {isOwner ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={q.isPublished}
                          onCheckedChange={(checked) =>
                            togglePublishMutation.mutate({ id: q.id, isPublished: checked })
                          }
                        />
                        <span className="text-sm">{q.isPublished ? 'Published' : 'Draft'}</span>
                      </div>
                    ) : (
                      <Badge variant={q.isPublished ? 'default' : 'secondary'}>
                        {q.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{q._count?.submissions ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: q.id, title: q.title });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No questionnaires yet. Create your first one to get started.
        </p>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Questionnaire</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone and all associated data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
