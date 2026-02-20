import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfettiButton } from "@/components/ui/confetti-button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  cacheQuestionnaire,
  enqueue,
  getCachedQuestionnaire,
  getQueueLength,
  isOnline,
  onConnectivityChange,
  processQueue,
} from "@/lib/offline";
import type { PdfData, PdfSection } from "@/lib/pdf";
import {
  buildPdfFilename,
  computeScores,
  generateSubmissionPdf,
  getMotivationalMessage,
} from "@/lib/pdf";
import { emailSubmissionSchema } from "@/lib/schemas";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Send,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

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
  isRequired: boolean;
  options: Option[];
}

interface Section {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  questions: Question[];
}

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  sections: Section[];
  tenant: {
    id: string;
    slug: string;
    name: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    headerTextColor: string | null;
    subtextColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
}

interface PreviewResultItem {
  sectionTitle: string;
  sectionCode: string | null;
  questionCode: string | null;
  questionPrompt: string;
  selectedLabel: string;
  allowedOptions: string[];
}

interface PdfPreviewResponse {
  questionnaireTitle: string;
  tenantName: string;
  results: {
    overallScore: number;
    totalScored: number;
    totalGraded: number;
    sectionScores: Array<{
      title: string;
      code: string | null;
      scored: number;
      total: number;
      percentage: number;
    }>;
    notAllowedItems: PreviewResultItem[];
  };
}

export function QuestionnairePage() {
  const { tenantSlug, questionnaireSlug } = useParams<{
    tenantSlug: string;
    questionnaireSlug: string;
  }>();
  const [searchParams] = useSearchParams();

  // localStorage key scoped to this specific questionnaire
  const storageKey = `gacs-draft:${tenantSlug}/${questionnaireSlug}`;

  // Restore persisted draft from localStorage (runs once)
  const savedDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          answers?: Record<string, string>;
          submissionId?: string;
          sectionIndex?: number;
        };
        return parsed;
      }
    } catch {
      /* ignore corrupt data */
    }
    return null;
  }, [storageKey]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    savedDraft?.sectionIndex ?? 0,
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    savedDraft?.answers ?? {},
  );
  const [submissionId, setSubmissionId] = useState<string | null>(
    savedDraft?.submissionId ?? null,
  );
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showInstantResults, setShowInstantResults] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);

  // Persist draft to localStorage whenever answers, submissionId or section changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers,
          submissionId,
          sectionIndex: currentSectionIndex,
        }),
      );
    } catch {
      /* storage full / unavailable – silently ignore */
    }
  }, [answers, submissionId, currentSectionIndex, storageKey]);

  // Clear localStorage after successful submission
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Offline status
  const [online, setOnline] = useState(isOnline());
  const [pendingOps, setPendingOps] = useState(getQueueLength());
  const [syncing, setSyncing] = useState(false);
  const [hasAppliedPrefill, setHasAppliedPrefill] = useState(false);

  const skipEmailStep = useMemo(() => {
    const value = (searchParams.get("skipEmailStep") || "").toLowerCase();
    return value === "1" || value === "true" || value === "yes";
  }, [searchParams]);

  const prefilledMode = useMemo(() => {
    const value = (searchParams.get("prefilled") || "").toLowerCase();
    return value === "1" || value === "true" || value === "yes";
  }, [searchParams]);

  useEffect(() => {
    return onConnectivityChange((status) => {
      setOnline(status);
      if (status) {
        // Auto-sync when coming back online
        syncQueue();
      }
    });
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await processQueue();
    } finally {
      setPendingOps(getQueueLength());
      setSyncing(false);
    }
  }, [syncing]);

  // Fetch questionnaire (with offline cache fallback)
  const {
    data: fetchedQuestionnaire,
    isLoading,
    error,
  } = useQuery<Questionnaire>({
    queryKey: ["questionnaire", tenantSlug, questionnaireSlug],
    queryFn: async () => {
      const { data } = await api.get(
        `/public/${tenantSlug}/${questionnaireSlug}`,
      );
      // Cache for offline use
      if (tenantSlug && questionnaireSlug) {
        cacheQuestionnaire(tenantSlug, questionnaireSlug, data);
      }
      return data;
    },
    retry: 1,
  });

  // Fall back to cached questionnaire if fetch failed
  const cachedData = useMemo(() => {
    if (fetchedQuestionnaire) return null;
    if (!tenantSlug || !questionnaireSlug) return null;
    return getCachedQuestionnaire<Questionnaire>(tenantSlug, questionnaireSlug);
  }, [fetchedQuestionnaire, tenantSlug, questionnaireSlug]);

  const questionnaire = fetchedQuestionnaire ?? cachedData?.data ?? null;
  const isOfflineMode = !fetchedQuestionnaire && !!cachedData;

  // Apply whitelabel theming
  useEffect(() => {
    if (questionnaire?.tenant) {
      const { primaryColor, secondaryColor, faviconUrl } = questionnaire.tenant;
      if (primaryColor) {
        const hsl = hexToHSL(primaryColor);
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
        // Set foreground color based on contrast
        const fg = isLightColor(primaryColor) ? "222 47% 11%" : "210 40% 98%";
        document.documentElement.style.setProperty("--primary-foreground", fg);
      }
      if (secondaryColor) {
        const hsl = hexToHSL(secondaryColor);
        document.documentElement.style.setProperty("--accent", hsl);
      }
      // Apply favicon
      if (faviconUrl) {
        let link = document.querySelector(
          "link[rel~='icon']",
        ) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      }
      document.title = `${questionnaire.title} - ${questionnaire.tenant.name}`;
    }
  }, [questionnaire]);

  // Start submission (or reuse existing one from localStorage)
  const startMutation = useMutation({
    mutationFn: async (questionnaireId: string) => {
      const { data } = await api.post("/submissions/start", {
        questionnaireId,
      });
      return data;
    },
    onSuccess: (data) => setSubmissionId(data.id),
    onError: () => {
      // Offline: create a temporary local submission ID
      if (questionnaire && !submissionId) {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSubmissionId(tempId);
        enqueue({
          type: "start_submission",
          payload: { questionnaireId: questionnaire.id, tempId },
        });
        setPendingOps(getQueueLength());
      }
    },
  });

  useEffect(() => {
    if (questionnaire && !submissionId && (!skipEmailStep || prefilledMode)) {
      startMutation.mutate(questionnaire.id);
    }
  }, [
    questionnaire,
    submissionId,
    skipEmailStep,
    prefilledMode,
    startMutation,
  ]);

  // Testing helper: prefill all answers and jump to the last section.
  const [hasPersistedPrefill, setHasPersistedPrefill] = useState(false);

  useEffect(() => {
    if (!questionnaire || !prefilledMode || hasAppliedPrefill) return;

    const nextAnswers: Record<string, string> = {};
    for (const section of questionnaire.sections) {
      for (const question of section.questions) {
        if (question.options.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * question.options.length,
          );
          const randomOption = question.options[randomIndex];
          nextAnswers[question.id] = randomOption.id;
        }
      }
    }

    setAnswers(nextAnswers);
    setCurrentSectionIndex(Math.max(0, questionnaire.sections.length - 1));
    setHasAppliedPrefill(true);
  }, [questionnaire, prefilledMode, hasAppliedPrefill]);

  // Persist prefilled answers to the database once submission is available
  useEffect(() => {
    if (!prefilledMode || !hasAppliedPrefill || hasPersistedPrefill) return;
    if (!submissionId || submissionId.startsWith("local-")) return;

    const entries = Object.entries(answers);
    if (entries.length === 0) return;

    setHasPersistedPrefill(true);

    (async () => {
      for (const [questionId, selectedOptionId] of entries) {
        try {
          await api.post(`/submissions/${submissionId}/answers`, {
            questionId,
            selectedOptionId,
          });
        } catch {
          /* best-effort — individual failures are non-critical */
        }
      }
    })();
  }, [
    prefilledMode,
    hasAppliedPrefill,
    hasPersistedPrefill,
    submissionId,
    answers,
  ]);

  // Save answer (with offline queue fallback)
  const saveAnswerMutation = useMutation({
    mutationFn: async ({
      questionId,
      selectedOptionId,
    }: {
      questionId: string;
      selectedOptionId: string;
    }) => {
      if (skipEmailStep) return;
      if (!submissionId) return;
      // Don't try API for local submissions – queue directly
      if (submissionId.startsWith("local-")) {
        throw new Error("offline");
      }
      await api.post(`/submissions/${submissionId}/answers`, {
        questionId,
        selectedOptionId,
      });
    },
    onError: (_err, variables) => {
      if (skipEmailStep) return;
      // Queue for later sync
      if (submissionId) {
        enqueue({
          type: "save_answer",
          payload: {
            submissionId,
            questionId: variables.questionId,
            selectedOptionId: variables.selectedOptionId,
          },
        });
        setPendingOps(getQueueLength());
      }
    },
  });

  // When a saved submission is restored and we get a new submissionId,
  // replay all cached answers to the backend so the server is in sync
  const [hasReplayedAnswers, setHasReplayedAnswers] = useState(false);
  useEffect(() => {
    if (!submissionId || hasReplayedAnswers) return;
    const savedAnswers = savedDraft?.answers;
    if (!savedAnswers || Object.keys(savedAnswers).length === 0) {
      setHasReplayedAnswers(true);
      return;
    }
    // If the submissionId changed (new submission), replay all answers
    if (savedDraft?.submissionId && savedDraft.submissionId === submissionId) {
      // Same submission – server already has the answers
      setHasReplayedAnswers(true);
      return;
    }
    // Different or new submission – replay saved answers (skip if offline local ID)
    if (!submissionId.startsWith("local-")) {
      for (const [questionId, selectedOptionId] of Object.entries(
        savedAnswers,
      )) {
        saveAnswerMutation.mutate({ questionId, selectedOptionId });
      }
    }
    setHasReplayedAnswers(true);
  }, [submissionId]);

  const handleAnswerSelect = useCallback(
    (questionId: string, optionId: string) => {
      // Always save locally first (localStorage persisted via the useEffect above)
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      // Then attempt API save (will queue on failure), unless skipEmailStep mode is active.
      if (!skipEmailStep) {
        saveAnswerMutation.mutate({ questionId, selectedOptionId: optionId });
      }
    },
    [skipEmailStep, saveAnswerMutation],
  );

  // Submit email (handles stale / already-finalized submissions automatically)
  const emailMutation = useMutation({
    mutationFn: async () => {
      let sid = submissionId;

      if (!sid || sid.startsWith("local-")) {
        // No valid submission yet – create one
        if (!questionnaire) throw new Error("Vragenlijst niet geladen.");
        const { data } = await api.post("/submissions/start", {
          questionnaireId: questionnaire.id,
        });
        sid = data.id;
        setSubmissionId(sid);
        // Replay all local answers to the new submission
        for (const [questionId, selectedOptionId] of Object.entries(answers)) {
          await api.post(`/submissions/${sid}/answers`, {
            questionId,
            selectedOptionId,
          });
        }
      }

      try {
        await api.post(`/submissions/${sid}/email`, {
          email,
          consentGiven: true,
        });
      } catch (err: any) {
        const errMsg: string = err?.response?.data?.message || "";
        // If the old submission is no longer usable, create a fresh one and retry.
        const shouldRecreateSubmission =
          errMsg.toLowerCase().includes("already finalized") ||
          errMsg.toLowerCase().includes("already consumed") ||
          errMsg.toLowerCase().includes("submission not found");

        if (shouldRecreateSubmission) {
          if (!questionnaire) throw new Error("Vragenlijst niet geladen.");
          const { data } = await api.post("/submissions/start", {
            questionnaireId: questionnaire.id,
          });
          sid = data.id;
          setSubmissionId(sid);
          // Replay all local answers to the new submission
          for (const [questionId, selectedOptionId] of Object.entries(
            answers,
          )) {
            await api.post(`/submissions/${sid}/answers`, {
              questionId,
              selectedOptionId,
            });
          }
          await api.post(`/submissions/${sid}/email`, {
            email,
            consentGiven: true,
          });
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      setEmailSent(true);
      clearDraft();
    },
    onError: (error: Error) => {
      const msg =
        (error as any)?.response?.data?.message ||
        error.message ||
        "Er is een fout opgetreden bij het verzenden.";
      setEmailError(msg);
    },
  });

  const handleEmailSubmit = useCallback(() => {
    const result = emailSubmissionSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }
    setEmailError("");
    emailMutation.mutate();
  }, [email, emailMutation]);

  const handleDownloadPdf = useCallback(() => {
    if (!questionnaire) return;
    const pdfData: PdfData = {
      questionnaireTitle: questionnaire.title,
      tenantName: questionnaire.tenant.name,
      respondentEmail: null,
      submittedAt: null,
      sections: questionnaire.sections.map((section) => ({
        code: section.code,
        title: section.title,
        questions: section.questions.map((q) => {
          const selectedOpt = q.options.find((o) => o.id === answers[q.id]);
          return {
            code: q.code,
            prompt: q.prompt,
            selectedOption: selectedOpt
              ? {
                  label: selectedOpt.label,
                  groupLabel: selectedOpt.groupLabel,
                  isAllowed: selectedOpt.isAllowed ?? null,
                }
              : null,
            allowedOptions: q.options
              .filter((o) => o.isAllowed === true)
              .map((o) => o.label),
          };
        }),
      })),
    };
    const doc = generateSubmissionPdf(pdfData);
    doc.save(buildPdfFilename(questionnaire.title));
  }, [questionnaire, answers]);

  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const currentSection = questionnaire?.sections[currentSectionIndex];
  const totalSections = questionnaire?.sections.length || 0;
  const totalQuestions =
    questionnaire?.sections.reduce((sum, s) => sum + s.questions.length, 0) ||
    0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= totalQuestions;

  const unansweredBySection = useMemo(() => {
    if (!questionnaire) return [];
    return questionnaire.sections
      .map((section) => {
        const missing = section.questions.filter((q) => !answers[q.id]);
        if (missing.length === 0) return null;
        return { section, questions: missing };
      })
      .filter(Boolean) as { section: Section; questions: Question[] }[];
  }, [questionnaire, answers]);

  const handleFinish = useCallback(() => {
    if (allAnswered) {
      if (skipEmailStep) {
        setShowInstantResults(true);
      } else {
        setShowEmailForm(true);
      }
    } else {
      setIncompleteDialogOpen(true);
    }
  }, [allAnswered, skipEmailStep]);

  const { data: previewData, isFetching: isLoadingPreview } =
    useQuery<PdfPreviewResponse>({
      queryKey: ["pdf-preview-data", questionnaire?.id, answers],
      queryFn: async () => {
        const { data } = await api.post(
          `/questionnaires/${questionnaire!.id}/pdf-preview-data`,
          {
            answers,
          },
        );
        return data;
      },
      enabled: skipEmailStep && showInstantResults && !!questionnaire?.id,
    });

  const handleRestartQuestionnaire = useCallback(() => {
    setAnswers({});
    setSubmissionId(null);
    setHasReplayedAnswers(false);
    setHasAppliedPrefill(false);
    setHasPersistedPrefill(false);
    setCurrentSectionIndex(0);
    setShowEmailForm(false);
    setShowInstantResults(false);
    setIncompleteDialogOpen(false);
    setEmailSent(false);
    setEmail("");
    setEmailError("");
    setConsentGiven(false);
    clearDraft();
  }, [clearDraft]);

  // Compute page background from branding
  const pageBackground: React.CSSProperties = questionnaire?.tenant
    ?.secondaryColor
    ? { backgroundColor: questionnaire.tenant.secondaryColor }
    : {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-5xl flex items-center gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl p-4 pt-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isLoading && !questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            {!online ? (
              <>
                <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Geen internetverbinding</CardTitle>
                <CardDescription>
                  U bent offline en deze vragenlijst is nog niet eerder geladen.
                  Maak verbinding met internet en probeer opnieuw.
                </CardDescription>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle>Vragenlijst niet gevonden</CardTitle>
                <CardDescription>
                  De vragenlijst is niet gevonden of is niet gepubliceerd.
                  Controleer de URL en probeer opnieuw.
                </CardDescription>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-muted/50 p-4"
        style={pageBackground}
      >
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>Verificatie-e-mail verzonden</CardTitle>
            <CardDescription>
              We hebben een verificatie-e-mail gestuurd naar{" "}
              <strong>{email}</strong>. Klik op de link in de e-mail om uw
              inzending te voltooien.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (showInstantResults && questionnaire) {
    const pdfSections: PdfSection[] = questionnaire.sections.map((section) => ({
      code: section.code,
      title: section.title,
      questions: section.questions.map((q) => {
        const selectedOpt = q.options.find((o) => o.id === answers[q.id]);
        return {
          code: q.code,
          prompt: q.prompt,
          selectedOption: selectedOpt
            ? {
                label: selectedOpt.label,
                groupLabel: selectedOpt.groupLabel,
                isAllowed: selectedOpt.isAllowed ?? null,
              }
            : null,
          allowedOptions: q.options
            .filter((o) => o.isAllowed === true)
            .map((o) => o.label),
        };
      }),
    }));
    const { overall: overallScore, sectionScores } = computeScores(pdfSections);
    const motivationalMsg = getMotivationalMessage(
      overallScore,
      questionnaire.tenant.name,
    );
    const scoreColorClass =
      overallScore >= 80
        ? "text-green-600"
        : overallScore >= 50
          ? "text-amber-600"
          : "text-red-600";
    const scoreBgClass =
      overallScore >= 80
        ? "bg-green-50 border-green-200 text-green-800"
        : overallScore >= 50
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-800";

    return (
      <div className="min-h-screen bg-muted/50" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <div className="mx-auto max-w-5xl p-4 pt-8 space-y-6">
          {/* Score overview */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center pb-2">
              <p className={`text-5xl font-bold ${scoreColorClass}`}>
                {overallScore}%
              </p>
              <CardTitle className="text-lg">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-md border p-3 text-sm ${scoreBgClass}`}>
                {motivationalMsg}
              </div>

              {/* Section scores */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Score per sectie</h4>
                {sectionScores.map((sec) => {
                  const barColor =
                    sec.percentage >= 80
                      ? "bg-green-500"
                      : sec.percentage >= 50
                        ? "bg-amber-500"
                        : "bg-red-500";
                  const label = sec.code
                    ? `${sec.code}. ${sec.title}`
                    : sec.title;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate mr-2">
                          {label}
                        </span>
                        <span className="font-semibold shrink-0">
                          {sec.percentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${sec.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action items */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Actiepunten - Niet-toegestane antwoorden</CardTitle>
              <CardDescription>
                De volgende antwoorden zijn niet toegestaan en moeten worden
                aangepast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPreview ? (
                <div className="rounded-md border p-4 text-muted-foreground">
                  Resultaten laden...
                </div>
              ) : (previewData?.results.notAllowedItems.length ?? 0) === 0 ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                  Geen directe verbeterpunten gevonden op basis van de huidige
                  antwoorden.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Verbeterpunten gevonden:{" "}
                    <strong>
                      {previewData?.results.notAllowedItems.length ?? 0}
                    </strong>
                  </p>
                  {previewData?.results.notAllowedItems.map((item, index) => (
                    <div
                      key={`${item.sectionTitle}-${index}`}
                      className="rounded-md border p-3"
                    >
                      <p className="text-sm font-semibold">
                        {item.questionCode
                          ? `${index + 1}. ${item.questionCode} - ${item.questionPrompt}`
                          : `${index + 1}. ${item.questionPrompt}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sectie:{" "}
                        {item.sectionCode ? `${item.sectionCode}. ` : ""}
                        {item.sectionTitle}
                      </p>
                      <p className="text-xs mt-2 text-red-700">
                        Huidig antwoord: {item.selectedLabel}
                      </p>
                      {item.allowedOptions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-green-700">
                            Toegestane alternatieven:
                          </p>
                          <ul className="mt-1 list-disc pl-5 text-xs text-green-700">
                            {item.allowedOptions.map((option) => (
                              <li key={option}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="flex-1"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button onClick={handleRestartQuestionnaire} className="flex-1">
                  Restart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-muted/50" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <div className="mx-auto max-w-5xl p-4 pt-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Bijna klaar!</CardTitle>
              <CardDescription>
                Voer uw e-mailadres in om uw inzending te voltooien. U ontvangt
                een verificatie-e-mail. Na verificatie ontvangt u een PDF met al
                uw ingevulde antwoorden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="uw@email.nl"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>
              <div className="flex items-start space-x-3 rounded-md border p-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) =>
                    setConsentGiven(checked === true)
                  }
                />
                <label
                  htmlFor="consent"
                  className="text-xs text-muted-foreground leading-snug cursor-pointer"
                >
                  Ik ga akkoord met de verwerking van mijn e-mailadres en
                  antwoorden door de organisatie die deze vragenlijst heeft
                  opgesteld, ten behoeve van analyse en rapportage. Mijn
                  gegevens worden bewaard volgens het retentiebeleid van de
                  organisatie. Ik heb recht op inzage, rectificatie en
                  verwijdering van mijn gegevens conform de AVG (GDPR).{" "}
                  <a
                    href="/gdpr/erasure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80"
                  >
                    Verwijderingsverzoek indienen
                  </a>
                </label>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                >
                  <ChevronLeft className="h-4 w-4" /> Terug
                </Button>
                <Button variant="outline" onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={emailMutation.isPending || !consentGiven}
                  className="flex-1"
                >
                  {emailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Verstuur PDF
                </Button>
              </div>
              {!online && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Verificatie vereist een internetverbinding. Uw antwoorden zijn
                  lokaal opgeslagen.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50" style={pageBackground}>
      <Header tenant={questionnaire.tenant} />

      {/* Offline / sync banner */}
      {!skipEmailStep && (!online || isOfflineMode || pendingOps > 0) && (
        <div
          className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${online ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700"}`}
        >
          {!online ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>
                U bent offline. Uw antwoorden worden lokaal opgeslagen en
                gesynchroniseerd wanneer u weer online bent.
              </span>
            </>
          ) : pendingOps > 0 ? (
            <>
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              <span>
                {syncing
                  ? "Synchroniseren..."
                  : `${pendingOps} wijziging(en) wachten op synchronisatie.`}
              </span>
              {!syncing && (
                <button
                  onClick={syncQueue}
                  className="underline font-medium ml-1"
                >
                  Nu synchroniseren
                </button>
              )}
            </>
          ) : isOfflineMode ? (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>
                Geladen vanuit cache. Sommige gegevens zijn mogelijk niet
                actueel.
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Sticky Stepper */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="w-full px-4 py-3">
          <ScrollArea className="w-full">
            <nav className="flex min-w-full items-center justify-center gap-0">
              {questionnaire.sections.map((section, idx) => {
                const sectionAnswered = section.questions.every(
                  (q) => answers[q.id],
                );
                const isCurrent = idx === currentSectionIndex;
                return (
                  <div
                    key={section.id}
                    className="flex items-center flex-shrink-0"
                  >
                    {idx > 0 && (
                      <div
                        className={`w-6 sm:w-10 h-0.5 ${idx <= currentSectionIndex ? "bg-primary" : "bg-muted-foreground/20"}`}
                      />
                    )}
                    <button
                      onClick={() => {
                        setCurrentSectionIndex(idx);
                        setTimeout(scrollToSection, 100);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${
                        isCurrent
                          ? "text-primary font-semibold"
                          : sectionAnswered
                            ? "text-muted-foreground hover:text-foreground"
                            : "text-muted-foreground/60 hover:text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold flex-shrink-0 border-2 transition-colors ${
                          sectionAnswered
                            ? "bg-primary border-primary text-primary-foreground"
                            : isCurrent
                              ? "border-primary text-primary bg-transparent"
                              : "border-muted-foreground/30 text-muted-foreground/50 bg-transparent"
                        }`}
                      >
                        {sectionAnswered ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className="hidden sm:inline">
                        {section.title.length > 20
                          ? section.title.substring(0, 20) + "…"
                          : section.title}
                      </span>
                    </button>
                  </div>
                );
              })}
            </nav>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-4 pt-8 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
            {skipEmailStep && (
              <Badge variant="secondary" className="text-xs">
                Direct result mode
              </Badge>
            )}
          </div>
          {questionnaire.description && (
            <p
              className="text-muted-foreground"
              style={
                questionnaire.tenant.subtextColor
                  ? { color: questionnaire.tenant.subtextColor }
                  : undefined
              }
            >
              {questionnaire.description}
            </p>
          )}
        </div>

        {/* Current Section */}
        {currentSection && (
          <Card ref={sectionRef}>
            <CardHeader>
              <CardTitle className="text-xl">
                {currentSection.code && (
                  <span className="text-primary mr-2">
                    {currentSection.code}.
                  </span>
                )}
                {currentSection.title}
              </CardTitle>
              {currentSection.description && (
                <CardDescription>{currentSection.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              {currentSection.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  selectedOptionId={answers[question.id]}
                  onSelect={(optionId) =>
                    handleAnswerSelect(question.id, optionId)
                  }
                  subtextColor={questionnaire.tenant.subtextColor}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pb-8">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentSectionIndex((i) => Math.max(0, i - 1));
              setTimeout(scrollToSection, 100);
            }}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Vorige
          </Button>

          <div className="flex gap-2">
            {currentSectionIndex < totalSections - 1 && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentSectionIndex((i) =>
                    Math.min(totalSections - 1, i + 1),
                  );
                  setTimeout(scrollToSection, 100);
                }}
              >
                Volgende <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {allAnswered ? (
              <ConfettiButton onClick={handleFinish}>
                <Send className="h-4 w-4" />
                {skipEmailStep ? "Bekijk resultaat" : "Afronden"}
              </ConfettiButton>
            ) : (
              <Button onClick={() => setIncompleteDialogOpen(true)}>
                <Send className="h-4 w-4" />
                Afronden
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Incomplete answers dialog */}
      <Dialog
        open={incompleteDialogOpen}
        onOpenChange={setIncompleteDialogOpen}
      >
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Niet alle vragen beantwoord
            </DialogTitle>
            <DialogDescription>
              De volgende vragen zijn nog niet beantwoord. Beantwoord alle
              vragen om de vragenlijst af te ronden.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4 py-2 pr-4">
              {unansweredBySection.map(({ section, questions }) => (
                <div key={section.id}>
                  <h4 className="font-semibold text-sm mb-1">
                    {section.code && (
                      <span className="text-primary mr-1">{section.code}.</span>
                    )}
                    {section.title}
                  </h4>
                  <ul className="space-y-1 ml-4">
                    {questions.map((q) => (
                      <li
                        key={q.id}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>
                          {q.code && (
                            <span className="font-medium text-foreground mr-1">
                              {q.code}
                            </span>
                          )}
                          {q.prompt}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIncompleteDialogOpen(false)}
            >
              Sluiten
            </Button>
            {unansweredBySection.length > 0 && (
              <Button
                onClick={() => {
                  const firstSection = unansweredBySection[0].section;
                  const idx = questionnaire.sections.findIndex(
                    (s) => s.id === firstSection.id,
                  );
                  if (idx >= 0) setCurrentSectionIndex(idx);
                  setIncompleteDialogOpen(false);
                  setTimeout(scrollToSection, 100);
                }}
              >
                Ga naar eerste ontbrekende vraag
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({ tenant }: { tenant: Questionnaire["tenant"] }) {
  const hasBranding = !!tenant.primaryColor;
  const textColor =
    tenant.headerTextColor ||
    (hasBranding
      ? isLightColor(tenant.primaryColor!)
        ? "#1e293b"
        : "#ffffff"
      : undefined);
  const headerStyle: React.CSSProperties = hasBranding
    ? { backgroundColor: tenant.primaryColor!, color: textColor }
    : {};

  return (
    <header
      className={hasBranding ? "shadow-sm" : "border-b bg-background"}
      style={headerStyle}
    >
      <div className="mx-auto max-w-5xl flex items-center gap-3 p-4">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="h-8 w-8 rounded object-contain"
            style={
              hasBranding
                ? { backgroundColor: "rgba(255,255,255,0.2)", padding: "2px" }
                : undefined
            }
          />
        ) : hasBranding ? (
          <div
            className="h-8 w-8 rounded flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {tenant.name?.[0] || "G"}
          </div>
        ) : null}
        <span className="font-semibold text-lg">{tenant.name}</span>
      </div>
    </header>
  );
}

function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  subtextColor,
}: {
  question: Question;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  subtextColor?: string | null;
}) {
  // Group options by groupLabel (only if meaningful labels exist)
  const groupedOptions = useMemo(() => {
    const hasGroupLabels = question.options.some((opt) => opt.groupLabel);
    if (!hasGroupLabels) {
      return null;
    }
    const groups: Record<string, Option[]> = {};
    for (const opt of question.options) {
      const group = opt.groupLabel || "Opties";
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [question.options]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium">
          {question.code && (
            <span className="text-primary mr-1">{question.code}</span>
          )}
          {question.prompt}
          {question.isRequired && (
            <span className="text-destructive ml-1">*</span>
          )}
        </h4>
        {question.helpText && (
          <p
            className="text-sm text-muted-foreground mt-1"
            style={subtextColor ? { color: subtextColor } : undefined}
          >
            {question.helpText}
          </p>
        )}
      </div>

      <RadioGroup value={selectedOptionId} onValueChange={onSelect}>
        {groupedOptions
          ? Object.entries(groupedOptions).map(([groupLabel, options]) => (
              <div key={groupLabel} className="space-y-2">
                <Badge
                  variant={
                    groupLabel === "Niet toegestaan" ? "destructive" : "default"
                  }
                  className="text-xs"
                >
                  {groupLabel}
                </Badge>
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 py-1"
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={option.id}
                      className="font-normal leading-snug cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            ))
          : question.options.map((option) => (
              <div key={option.id} className="flex items-start space-x-3 py-1">
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={option.id}
                  className="font-normal leading-snug cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
      </RadioGroup>

      <Separator />
    </div>
  );
}

// Helper: convert hex color to HSL string
function hexToHSL(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Helper: determine if a hex color is "light" (for choosing contrasting text)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance formula (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
