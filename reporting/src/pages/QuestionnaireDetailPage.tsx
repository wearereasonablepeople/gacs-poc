import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  getFieldErrors,
  optionSchema,
  questionSchema,
  sectionSchema,
  type FieldErrors,
  type OptionData,
  type QuestionData,
  type SectionData,
} from "@/lib/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconPicker, DynamicIcon } from "@/components/IconPicker";
import { ImageUpload } from "@/components/ImageUpload";
import { Textarea } from "@/components/ui/textarea";

interface Option {
  id: string;
  label: string;
  groupLabel: string | null;
  isAllowed: boolean | null;
  displayOrder: number;
}

interface Question {
  id: string;
  code: string | null;
  prompt: string;
  helpText: string | null;
  imageUrl: string | null;
  imageScale: number | null;
  isRequired: boolean;
  displayOrder: number;
  options: Option[];
}

interface Section {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  imageScale: number | null;
  displayOrder: number;
  questions: Question[];
}

interface Questionnaire {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  introTitle: string | null;
  introDescription: string | null;
  introImageUrl: string | null;
  introImageScale: number | null;
  estimatedMinutes: number | null;
  completionTitle: string | null;
  completionDescription: string | null;
  completionImageUrl: string | null;
  showConfetti: boolean;
  isPublished: boolean;
  sections: Section[];
}

interface Submission {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  leadStatus: "open" | "in_progress" | "closed";
  respondent: { email: string; isEmailVerified: boolean } | null;
  _count: { answers: number };
  totalQuestions: number;
}

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

export default function QuestionnaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();

  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Submission detail
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false);

  // Section dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionIcon, setSectionIcon] = useState<string | null>(null);
  const [sectionImageUrl, setSectionImageUrl] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<FieldErrors<SectionData>>(
    {},
  );

  // Question dialog
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionSectionId, setQuestionSectionId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionHelpText, setQuestionHelpText] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState<string | null>(null);
  const [questionRequired, setQuestionRequired] = useState(false);
  const [questionErrors, setQuestionErrors] = useState<
    FieldErrors<QuestionData>
  >({});

  // Questionnaire intro state
  const [introTitle, setIntroTitle] = useState("");
  const [introDescription, setIntroDescription] = useState("");
  const [introImageUrl, setIntroImageUrl] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");
  const [introSaved, setIntroSaved] = useState(false);
  const introSyncedRef = useRef(false);

  // Questionnaire completion state
  const [completionTitle, setCompletionTitle] = useState("");
  const [completionDescription, setCompletionDescription] = useState("");
  const [completionImageUrl, setCompletionImageUrl] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionSaved, setCompletionSaved] = useState(false);
  const completionSyncedRef = useRef(false);

  // Option dialog
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionQuestionId, setOptionQuestionId] = useState("");
  const [optionLabel, setOptionLabel] = useState("");
  const [optionIsAllowed, setOptionIsAllowed] = useState<string>("allowed");
  const [optionErrors, setOptionErrors] = useState<FieldErrors<OptionData>>({});

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "section" | "question" | "option";
    sectionId: string;
    questionId?: string;
    optionId?: string;
    label: string;
  } | null>(null);

  const { data: questionnaire, isLoading } = useQuery<Questionnaire>({
    queryKey: ["questionnaire", id],
    queryFn: async () => {
      const { data } = await api.get(`/questionnaires/${id}`);
      return data;
    },
    enabled: !!user?.tenantId && !!id,
  });

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["questionnaire-submissions", id],
    queryFn: async () => {
      const { data } = await api.get(`/questionnaires/${id}/submissions`);
      return data;
    },
    enabled: !!user?.tenantId && !!id,
  });

  const { data: submissionDetail } = useQuery<SubmissionDetail>({
    queryKey: ["submission-detail", selectedSubmissionId],
    queryFn: async () => {
      const { data } = await api.get(`/submissions/${selectedSubmissionId}`);
      return data;
    },
    enabled: !!selectedSubmissionId && submissionDetailOpen,
  });

  useEffect(() => {
    if (questionnaire && !introSyncedRef.current) {
      introSyncedRef.current = true;
      setIntroTitle(questionnaire.introTitle || "");
      setIntroDescription(questionnaire.introDescription || "");
      setIntroImageUrl(questionnaire.introImageUrl || null);
      setEstimatedMinutes(questionnaire.estimatedMinutes?.toString() || "");
    }
    if (questionnaire && !completionSyncedRef.current) {
      completionSyncedRef.current = true;
      setCompletionTitle(questionnaire.completionTitle || "");
      setCompletionDescription(questionnaire.completionDescription || "");
      setCompletionImageUrl(questionnaire.completionImageUrl || null);
      setShowConfetti(questionnaire.showConfetti ?? false);
    }
  }, [questionnaire]);

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
      queryClient.invalidateQueries({ queryKey: ["questionnaire-submissions", id] });
      queryClient.invalidateQueries({
        queryKey: ["submission-detail", selectedSubmissionId],
      });
    },
  });

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/questionnaires/${id}/sections`, {
        title: sectionTitle,
        description: sectionDescription || undefined,
        icon: sectionIcon || undefined,
        imageUrl: sectionImageUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setSectionDialogOpen(false);
      resetSectionForm();
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/questionnaires/${id}/sections/${editingSection!.id}`, {
        title: sectionTitle,
        description: sectionDescription || undefined,
        icon: sectionIcon,
        imageUrl: sectionImageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setSectionDialogOpen(false);
      resetSectionForm();
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(`/questionnaires/${id}/sections/${sectionId}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] }),
  });

  const reorderSectionMutation = useMutation({
    mutationFn: async ({ orderedIds }: { orderedIds: string[] }) => {
      await api.post(`/questionnaires/${id}/sections/reorder`, { orderedIds });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] }),
  });

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/sections/${questionSectionId}/questions`, {
        prompt: questionText,
        helpText: questionHelpText || undefined,
        imageUrl: questionImageUrl || undefined,
        isRequired: questionRequired,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setQuestionDialogOpen(false);
      resetQuestionForm();
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async () => {
      await api.patch(
        `/sections/${questionSectionId}/questions/${editingQuestion!.id}`,
        {
          prompt: questionText,
          helpText: questionHelpText || null,
          imageUrl: questionImageUrl,
          isRequired: questionRequired,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setQuestionDialogOpen(false);
      resetQuestionForm();
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      questionId,
    }: {
      sectionId: string;
      questionId: string;
    }) => {
      await api.delete(`/sections/${sectionId}/questions/${questionId}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] }),
  });

  // Option mutations
  const createOptionMutation = useMutation({
    mutationFn: async () => {
      const isAllowed =
        optionIsAllowed === "allowed"
          ? true
          : optionIsAllowed === "not_allowed"
            ? false
            : null;
      await api.post(`/questions/${optionQuestionId}/options`, {
        label: optionLabel,
        isAllowed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setOptionDialogOpen(false);
      resetOptionForm();
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({
      questionId,
      optionId,
      isAllowed,
    }: {
      questionId: string;
      optionId: string;
      isAllowed: boolean | null;
    }) => {
      await api.patch(`/questions/${questionId}/options/${optionId}`, {
        isAllowed,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] }),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async ({
      questionId,
      optionId,
    }: {
      sectionId: string;
      questionId: string;
      optionId: string;
    }) => {
      await api.delete(`/questions/${questionId}/options/${optionId}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] }),
  });

  const updateIntroMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/questionnaires/${id}`, {
        introTitle: introTitle || null,
        introDescription: introDescription || null,
        introImageUrl: introImageUrl,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setIntroSaved(true);
      setTimeout(() => setIntroSaved(false), 3000);
    },
  });

  const updateCompletionMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/questionnaires/${id}`, {
        completionTitle: completionTitle || null,
        completionDescription: completionDescription || null,
        completionImageUrl: completionImageUrl,
        showConfetti,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire", id] });
      setCompletionSaved(true);
      setTimeout(() => setCompletionSaved(false), 3000);
    },
  });

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDragIdx(null);
      return;
    }
    if (dragItem.current === dragOverItem.current) {
      setDragIdx(null);
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const sorted = [...(questionnaire?.sections || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const ids = sorted.map((s) => s.id);
    const [removed] = ids.splice(dragItem.current, 1);
    ids.splice(dragOverItem.current, 0, removed);

    reorderSectionMutation.mutate({ orderedIds: ids });

    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
  }, [questionnaire, reorderSectionMutation]);

  function resetSectionForm() {
    setEditingSection(null);
    setSectionTitle("");
    setSectionDescription("");
    setSectionIcon(null);
    setSectionImageUrl(null);
    setSectionErrors({});
  }

  function resetQuestionForm() {
    setEditingQuestion(null);
    setQuestionSectionId("");
    setQuestionText("");
    setQuestionHelpText("");
    setQuestionImageUrl(null);
    setQuestionRequired(false);
    setQuestionErrors({});
  }

  function resetOptionForm() {
    setOptionQuestionId("");
    setOptionLabel("");
    setOptionIsAllowed("none");
    setOptionErrors({});
  }

  function handleSectionSubmit() {
    const result = getFieldErrors(sectionSchema, {
      title: sectionTitle,
      description: sectionDescription || undefined,
    });
    if (!result.success) {
      setSectionErrors(result.errors);
      return;
    }
    setSectionErrors({});
    editingSection
      ? updateSectionMutation.mutate()
      : createSectionMutation.mutate();
  }

  function handleQuestionSubmit() {
    const result = getFieldErrors(questionSchema, {
      prompt: questionText,
      helpText: questionHelpText || undefined,
      isRequired: questionRequired,
    });
    if (!result.success) {
      setQuestionErrors(result.errors);
      return;
    }
    setQuestionErrors({});
    editingQuestion
      ? updateQuestionMutation.mutate()
      : createQuestionMutation.mutate();
  }

  function handleOptionSubmit() {
    const result = getFieldErrors(optionSchema, { label: optionLabel });
    if (!result.success) {
      setOptionErrors(result.errors);
      return;
    }
    setOptionErrors({});
    createOptionMutation.mutate();
  }

  function openEditSection(section: Section) {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description || "");
    setSectionIcon(section.icon);
    setSectionImageUrl(section.imageUrl);
    setSectionDialogOpen(true);
  }

  function openAddQuestion(sectionId: string) {
    resetQuestionForm();
    setQuestionSectionId(sectionId);
    setQuestionDialogOpen(true);
  }

  function openEditQuestion(sectionId: string, question: Question) {
    setEditingQuestion(question);
    setQuestionSectionId(sectionId);
    setQuestionText(question.prompt);
    setQuestionHelpText(question.helpText || "");
    setQuestionImageUrl(question.imageUrl || null);
    setQuestionRequired(question.isRequired);
    setQuestionDialogOpen(true);
  }

  function openAddOption(questionId: string) {
    resetOptionForm();
    setOptionQuestionId(questionId);
    setOptionDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Questionnaire not found
      </p>
    );
  }

  const sortedSections = [...(questionnaire.sections || [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const submittedSubmissions = submissions ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/questionnaires">Questionnaires</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{questionnaire.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/questionnaires">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {questionnaire.title}
          </h2>
          <p className="text-muted-foreground">{questionnaire.description}</p>
        </div>
        <Badge variant={questionnaire.isPublished ? "default" : "secondary"}>
          {questionnaire.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      <Tabs defaultValue="introduction">
        <TabsList>
          <TabsTrigger value="introduction">Introduction</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
          <TabsTrigger value="sections">
            Sections ({sortedSections.length})
          </TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submittedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Introduction tab */}
        <TabsContent value="introduction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questionnaire Introduction Page</CardTitle>
              <CardDescription>
                This is the first page respondents see before starting the questionnaire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Intro Title</Label>
                    <Input
                      placeholder={questionnaire.title}
                      value={introTitle}
                      onChange={(e) => setIntroTitle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Defaults to the questionnaire title if empty.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Intro Description</Label>
                    <Textarea
                      placeholder="Welcome the respondent, explain the purpose, and set expectations..."
                      value={introDescription}
                      onChange={(e) => setIntroDescription(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 2"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Intro Image</Label>
                  <ImageUpload
                    value={introImageUrl}
                    onChange={setIntroImageUrl}
                  />
                </div>
              </div>
              <Button
                onClick={() => updateIntroMutation.mutate()}
                disabled={updateIntroMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {updateIntroMutation.isPending ? "Saving..." : introSaved ? "Saved!" : "Save Introduction"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion tab */}
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questionnaire Completion Page</CardTitle>
              <CardDescription>
                Customize what respondents see after finishing the questionnaire and submitting their email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Completion Title</Label>
                    <Input
                      placeholder="Bedankt voor het invullen!"
                      value={completionTitle}
                      onChange={(e) => setCompletionTitle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown as the heading on the completion page. Defaults to a generic thank-you message if empty.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Completion Description</Label>
                    <Textarea
                      placeholder="Describe what happens next, or thank the respondent..."
                      value={completionDescription}
                      onChange={(e) => setCompletionDescription(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="showConfetti"
                      checked={showConfetti}
                      onCheckedChange={setShowConfetti}
                    />
                    <Label htmlFor="showConfetti">Show confetti animation on completion</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Completion Image</Label>
                  <ImageUpload
                    value={completionImageUrl}
                    onChange={setCompletionImageUrl}
                  />
                </div>
              </div>
              <Button
                onClick={() => updateCompletionMutation.mutate()}
                disabled={updateCompletionMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {updateCompletionMutation.isPending ? "Saving..." : completionSaved ? "Saved!" : "Save Completion"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections tab */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetSectionForm();
                setSectionDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>

          {sortedSections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No sections yet. Add a section to start building your
                questionnaire.
              </CardContent>
            </Card>
          )}

          {sortedSections.map((section, sIdx) => {
            const sortedQuestions = [...section.questions].sort(
              (a, b) => a.displayOrder - b.displayOrder,
            );
            const isCollapsed = collapsedSections.has(section.id);

            return (
              <Collapsible
                key={section.id}
                open={!isCollapsed}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card
                  draggable
                  onDragStart={() => handleDragStart(sIdx)}
                  onDragEnter={() => handleDragEnter(sIdx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`transition-opacity ${dragIdx === sIdx ? "opacity-50" : ""}`}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none p-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-shrink-0">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <DynamicIcon name={section.icon} className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 overflow-hidden">
                            <CardTitle className="text-lg truncate">
                              {section.code && (
                                <span className="text-primary mr-1">
                                  {section.code}.
                                </span>
                              )}
                              {section.title}
                            </CardTitle>
                            {section.description && (
                              <CardDescription className="truncate">
                                {section.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 flex-shrink-0 ml-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {section.questions.length} question
                            {section.questions.length !== 1 ? "s" : ""}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => openEditSection(section)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "section",
                                  sectionId: section.id,
                                  label: section.title,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {sortedQuestions.map((question) => {
                        const sortedOptions = [...question.options].sort(
                          (a, b) => a.displayOrder - b.displayOrder,
                        );
                        return (
                          <div
                            key={question.id}
                            className="rounded-lg border p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {question.code && (
                                      <span className="text-primary mr-1">
                                        {question.code}
                                      </span>
                                    )}
                                    {question.prompt}
                                  </p>
                                  {question.isRequired && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                {question.helpText && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {question.helpText}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openEditQuestion(section.id, question)
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "question",
                                      sectionId: section.id,
                                      questionId: question.id,
                                      label: question.prompt,
                                    })
                                  }
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Answer Options */}
                            <div className="ml-4 space-y-1">
                              {sortedOptions.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                                    {option.label}
                                    {option.isAllowed === true && (
                                      <Badge
                                        variant="default"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Allowed
                                      </Badge>
                                    )}
                                    {option.isAllowed === false && (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Not allowed
                                      </Badge>
                                    )}
                                  </span>
                                  <div
                                    className="flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      value={
                                        option.isAllowed === true
                                          ? "allowed"
                                          : option.isAllowed === false
                                            ? "not_allowed"
                                            : "none"
                                      }
                                      onValueChange={(val) => {
                                        const isAllowed =
                                          val === "allowed"
                                            ? true
                                            : val === "not_allowed"
                                              ? false
                                              : null;
                                        updateOptionMutation.mutate({
                                          questionId: question.id,
                                          optionId: option.id,
                                          isAllowed,
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 w-[120px] text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">—</SelectItem>
                                        <SelectItem value="allowed">
                                          Allowed
                                        </SelectItem>
                                        <SelectItem value="not_allowed">
                                          Not allowed
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        setDeleteTarget({
                                          type: "option",
                                          sectionId: section.id,
                                          questionId: question.id,
                                          optionId: option.id,
                                          label: option.label,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => openAddOption(question.id)}
                              >
                                <Plus className="h-3 w-3" />
                                Add Answer Option
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddQuestion(section.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </TabsContent>

        {/* Submissions tab */}
        <TabsContent value="submissions" className="space-y-4">
          {submittedSubmissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Answers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedSubmissions.map((sub) => {
                    return (
                      <TableRow
                        key={sub.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedSubmissionId(sub.id);
                          setSubmissionDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {sub.respondent?.email || (
                            <span className="text-muted-foreground italic">
                              Anoniem
                            </span>
                          )}
                          {sub.respondent?.isEmailVerified && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Verified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub._count.answers} / {sub.totalQuestions}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Badge
                              variant={
                                sub.leadStatus === "open"
                                  ? "secondary"
                                  : sub.leadStatus === "in_progress"
                                    ? "outline"
                                    : "default"
                              }
                            >
                              {sub.leadStatus === "open"
                                ? "Open"
                                : sub.leadStatus === "in_progress"
                                  ? "In behandeling"
                                  : "Afgehandeld"}
                            </Badge>
                            <Select
                              value={sub.leadStatus}
                              onValueChange={(
                                value: "open" | "in_progress" | "closed",
                              ) =>
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
                                <SelectItem value="in_progress">
                                  In behandeling
                                </SelectItem>
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
              No submissions for this questionnaire yet
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Submission detail dialog */}
      <Dialog
        open={submissionDetailOpen}
        onOpenChange={setSubmissionDetailOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Detail
            </DialogTitle>
            <DialogDescription>
              {submissionDetail?.respondent?.email || "Anoniem"} —{" "}
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
                      {submissionDetail.respondent?.email ?? "Anoniem"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={
                          submissionDetail.leadStatus === "open"
                            ? "secondary"
                            : submissionDetail.leadStatus === "in_progress"
                              ? "outline"
                              : "default"
                        }
                      >
                        {submissionDetail.leadStatus === "open"
                          ? "Open"
                          : submissionDetail.leadStatus === "in_progress"
                            ? "In behandeling"
                            : "Afgehandeld"}
                      </Badge>
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

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Edit Section" : "Add Section"}
            </DialogTitle>
            <DialogDescription>
              {editingSection
                ? "Update the section details, icon, and intro image"
                : "Create a new section for this questionnaire"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Section title"
                value={sectionTitle}
                onChange={(e) => {
                  setSectionTitle(e.target.value);
                  if (sectionErrors.title)
                    setSectionErrors((p) => ({ ...p, title: undefined }));
                }}
                className={sectionErrors.title ? "border-destructive" : ""}
              />
              {sectionErrors.title && (
                <p className="text-xs text-destructive">
                  {sectionErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this section for respondents (shown on the section intro page)"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Icon (stepper)</Label>
                <IconPicker value={sectionIcon} onChange={setSectionIcon} />
              </div>
              <div className="space-y-2">
                <Label>Section Image</Label>
                <ImageUpload
                  value={sectionImageUrl}
                  onChange={setSectionImageUrl}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSectionSubmit}>
              <Save className="h-4 w-4" />
              {editingSection ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Update the question"
                : "Add a new question to this section"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Input
                placeholder="Enter your question"
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value);
                  if (questionErrors.prompt)
                    setQuestionErrors((p) => ({ ...p, prompt: undefined }));
                }}
                className={questionErrors.prompt ? "border-destructive" : ""}
              />
              {questionErrors.prompt && (
                <p className="text-xs text-destructive">
                  {questionErrors.prompt}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Help Text{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                placeholder="Additional context or instructions for the respondent"
                value={questionHelpText}
                onChange={(e) => setQuestionHelpText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Question Image{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <ImageUpload
                value={questionImageUrl}
                onChange={setQuestionImageUrl}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={questionRequired}
                onCheckedChange={(checked) =>
                  setQuestionRequired(checked === true)
                }
              />
              <Label htmlFor="required">Required</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuestionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleQuestionSubmit}>
              <Save className="h-4 w-4" />
              {editingQuestion ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Answer Option</DialogTitle>
            <DialogDescription>
              Add a new answer option to this question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g. Automatische regeling met timer"
                value={optionLabel}
                onChange={(e) => {
                  setOptionLabel(e.target.value);
                  if (optionErrors.label)
                    setOptionErrors((p) => ({ ...p, label: undefined }));
                }}
                className={optionErrors.label ? "border-destructive" : ""}
              />
              {optionErrors.label && (
                <p className="text-xs text-destructive">{optionErrors.label}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Compliance status{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Select
                value={optionIsAllowed}
                onValueChange={setOptionIsAllowed}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No designation</SelectItem>
                  <SelectItem value="allowed">Allowed</SelectItem>
                  <SelectItem value="not_allowed">Not allowed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mark as &quot;Not allowed&quot; to flag this answer in the PDF
                report when selected by a respondent.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOptionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleOptionSubmit}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "section" && "Delete Section"}
              {deleteTarget?.type === "question" && "Delete Question"}
              {deleteTarget?.type === "option" && "Delete Option"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "section" &&
                `Are you sure you want to delete "${deleteTarget.label}" and all its questions? This action cannot be undone.`}
              {deleteTarget?.type === "question" &&
                `Are you sure you want to delete this question? This action cannot be undone.`}
              {deleteTarget?.type === "option" &&
                `Are you sure you want to delete the option "${deleteTarget.label}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "section") {
                  deleteSectionMutation.mutate(deleteTarget.sectionId);
                } else if (
                  deleteTarget.type === "question" &&
                  deleteTarget.questionId
                ) {
                  deleteQuestionMutation.mutate({
                    sectionId: deleteTarget.sectionId,
                    questionId: deleteTarget.questionId,
                  });
                } else if (
                  deleteTarget.type === "option" &&
                  deleteTarget.questionId &&
                  deleteTarget.optionId
                ) {
                  deleteOptionMutation.mutate({
                    sectionId: deleteTarget.sectionId,
                    questionId: deleteTarget.questionId,
                    optionId: deleteTarget.optionId,
                  });
                }
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
