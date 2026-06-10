import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicIcon } from "@/components/DynamicIcon";
import api from "@/lib/api";
import {
  cacheQuestionnaire,
  enqueue,
  getCachedQuestionnaire,
  isOnline,
  onConnectivityChange,
  processQueue,
} from "@/lib/offline";
import type { PdfData } from "@/lib/pdf";
import {
  buildPdfFilename,
  computeScores,
  generateSubmissionPdf,
} from "@/lib/pdf";
import {
  getIntroDisplayImageUrl,
  getSectionDisplayImageUrl,
} from "@/lib/sectionImages";
import confetti from "canvas-confetti";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Download,
  Loader2,
  TrendingDown,
  TrendingUp,
  Trophy,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

// ─── Type definitions ────────────────────────────────────

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
  questions: Question[];
}

interface Questionnaire {
  id: string;
  title: string;
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
  sections: Section[];
  tenant: {
    id: string;
    slug: string;
    name: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    headerTextColor: string | null;
    subtextColor: string | null;
    startButtonColor: string | null;
    previousButtonColor: string | null;
    nextQuestionButtonColor: string | null;
    prevQuestionButtonColor: string | null;
    stepNavBgColor: string | null;
    stepNavTextColor: string | null;
    progressBarBgColor: string | null;
    progressBarColor: string | null;
    progressBarTextColor: string | null;
    questionContainerBgColor: string | null;
    activeChapterIndicatorColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
}

type Step =
  | { type: "intro" }
  | { type: "section-intro"; sectionIndex: number }
  | { type: "question"; sectionIndex: number; questionIndex: number }
  | { type: "complete" };

function stepOrder(s: Step): number {
  switch (s.type) {
    case "intro": return 0;
    case "section-intro": return 1000 + s.sectionIndex * 100;
    case "question": return 1000 + s.sectionIndex * 100 + s.questionIndex + 1;
    case "complete": return 100000;
  }
}

// ─── Main component ──────────────────────────────────────

export function QuestionnairePage() {
  const { tenantSlug, questionnaireSlug } = useParams<{
    tenantSlug: string;
    questionnaireSlug: string;
  }>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [step, setStepRaw] = useState<Step>({ type: "intro" });
  const navDirectionRef = useRef<"fwd" | "back">("fwd");

  const setStep = useCallback((next: Step) => {
    setStepRaw((prev) => {
      const prevOrder = stepOrder(prev);
      const nextOrder = stepOrder(next);
      navDirectionRef.current = nextOrder >= prevOrder ? "fwd" : "back";
      return next;
    });
  }, []);
  const [finalizeError, setFinalizeError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);

  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return onConnectivityChange((status) => {
      setOnline(status);
      if (status) syncQueue();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncQueue = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try { await processQueue(); } finally { setSyncing(false); }
  }, [syncing]);

  // Fetch questionnaire
  const { data: fetchedQuestionnaire, isLoading } = useQuery<Questionnaire>({
    queryKey: ["questionnaire", tenantSlug, questionnaireSlug],
    queryFn: async () => {
      const { data } = await api.get(`/public/${tenantSlug}/${questionnaireSlug}`);
      if (tenantSlug && questionnaireSlug) cacheQuestionnaire(tenantSlug, questionnaireSlug, data);
      return data;
    },
    retry: 1,
  });

  const cachedData = useMemo(() => {
    if (fetchedQuestionnaire) return null;
    if (!tenantSlug || !questionnaireSlug) return null;
    return getCachedQuestionnaire<Questionnaire>(tenantSlug, questionnaireSlug);
  }, [fetchedQuestionnaire, tenantSlug, questionnaireSlug]);

  const questionnaire = fetchedQuestionnaire ?? cachedData?.data ?? null;

  // Branding
  useEffect(() => {
    if (!questionnaire?.tenant) return;
    const { primaryColor, secondaryColor, faviconUrl } = questionnaire.tenant;
    if (primaryColor) {
      const hsl = hexToHSL(primaryColor);
      document.documentElement.style.setProperty("--primary", hsl);
      document.documentElement.style.setProperty("--ring", hsl);
      const fg = isLightColor(primaryColor) ? "222 47% 11%" : "210 40% 98%";
      document.documentElement.style.setProperty("--primary-foreground", fg);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty("--accent", hexToHSL(secondaryColor));
    }
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = faviconUrl.startsWith("/api/") ? `${apiBase}${faviconUrl}` : faviconUrl;
    }
    document.title = `${questionnaire.title} - ${questionnaire.tenant.name}`;
  }, [questionnaire]);

  // Confetti on completion
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (step.type === "complete" && questionnaire?.showConfetti && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      const end = Date.now() + 2500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [step.type, questionnaire?.showConfetti]);

  // Start submission
  const startMutation = useMutation({
    mutationFn: async (questionnaireId: string) => {
      const { data } = await api.post("/submissions/start", { questionnaireId });
      return data;
    },
    onSuccess: (data) => setSubmissionId(data.id),
    onError: () => {
      if (questionnaire && !submissionId) {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSubmissionId(tempId);
        enqueue({ type: "start_submission", payload: { questionnaireId: questionnaire.id, tempId } });
      }
    },
  });

  const didStartRef = useRef(false);
  useEffect(() => {
    if (questionnaire && !submissionId && !didStartRef.current) {
      didStartRef.current = true;
      startMutation.mutate(questionnaire.id);
    }
  }, [questionnaire, submissionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save answer
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string }) => {
      if (!submissionId) return;
      if (submissionId.startsWith("local-")) throw new Error("offline");
      await api.post(`/submissions/${submissionId}/answers`, { questionId, selectedOptionId });
    },
    onError: (_err, variables) => {
      if (!submissionId) return;
      enqueue({ type: "save_answer", payload: { submissionId, questionId: variables.questionId, selectedOptionId: variables.selectedOptionId } });
    },
  });

  const handleAnswerSelect = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      saveAnswerMutation.mutate({ questionId, selectedOptionId: optionId });
    },
    [saveAnswerMutation],
  );

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      let sid = submissionId;
      if (!sid || sid.startsWith("local-")) {
        if (!questionnaire) throw new Error("Vragenlijst niet geladen.");
        const { data } = await api.post("/submissions/start", { questionnaireId: questionnaire.id });
        sid = data.id;
        setSubmissionId(sid);
      }
      for (const [qId, oId] of Object.entries(answers)) {
        await api.post(`/submissions/${sid}/answers`, { questionId: qId, selectedOptionId: oId });
      }
      try {
        await api.post(`/submissions/${sid}/finalize`);
      } catch (err: any) {
        const msg: string = err?.response?.data?.message || "";
        if (msg.toLowerCase().includes("already finalized") || msg.toLowerCase().includes("submission not found")) {
          if (!questionnaire) throw new Error("Vragenlijst niet geladen.");
          const { data } = await api.post("/submissions/start", { questionnaireId: questionnaire.id });
          sid = data.id;
          setSubmissionId(sid);
          for (const [qId, oId] of Object.entries(answers)) {
            await api.post(`/submissions/${sid}/answers`, { questionId: qId, selectedOptionId: oId });
          }
          await api.post(`/submissions/${sid}/finalize`);
        } else throw err;
      }
    },
    onSuccess: () => { setFinalizeError(""); },
    onError: (error: Error) => {
      setFinalizeError((error as any)?.response?.data?.message || error.message || "Er is een fout opgetreden.");
    },
  });

  const finalizeAttemptedRef = useRef(false);
  useEffect(() => {
    if (step.type !== "complete" || finalizeAttemptedRef.current) return;
    finalizeAttemptedRef.current = true;
    finalizeMutation.mutate();
  }, [step.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadPdf = useCallback(async () => {
    if (!questionnaire || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const pdfData: PdfData = {
        questionnaireTitle: questionnaire.title,
        tenantName: questionnaire.tenant.name,
        respondentEmail: null,
        submittedAt: new Date().toISOString(),
        logoUrl: questionnaire.tenant.logoUrl,
        sections: questionnaire.sections.map((section) => ({
          code: section.code,
          title: section.title,
          questions: section.questions.map((q) => {
            const sel = q.options.find((o) => o.id === answers[q.id]);
            return {
              code: q.code, prompt: q.prompt,
              selectedOption: sel ? { label: sel.label, groupLabel: sel.groupLabel, isAllowed: sel.isAllowed ?? null } : null,
              allowedOptions: q.options.filter((o) => o.isAllowed === true).map((o) => o.label),
            };
          }),
        })),
      };
      const doc = await generateSubmissionPdf(pdfData);
      doc.save(buildPdfFilename(questionnaire.title));
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [questionnaire, answers, isGeneratingPdf]);

  // ─── Derived data ───────────────────────────────────────
  const totalQuestions = questionnaire?.sections.reduce((s, sec) => s + sec.questions.length, 0) || 0;
  const answeredCount = Object.keys(answers).length;

  const unansweredBySection = useMemo(() => {
    if (!questionnaire) return [];
    return questionnaire.sections
      .map((sec) => ({ section: sec, questions: sec.questions.filter((q) => !answers[q.id]) }))
      .filter((s) => s.questions.length > 0);
  }, [questionnaire, answers]);

  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
  const resolveImageUrl = useCallback((url: string | null | undefined) => {
    if (!url) return undefined;
    return url.startsWith("/api/") ? `${apiBase}${url}` : url;
  }, [apiBase]);

  const pageBackground: React.CSSProperties = questionnaire?.tenant?.secondaryColor
    ? { backgroundColor: questionnaire.tenant.secondaryColor }
    : {};

  // ─── Navigation helpers ─────────────────────────────────

  function advanceAfterAnswer(sectionIndex: number, questionIndex: number) {
    if (!questionnaire) return;
    const section = questionnaire.sections[sectionIndex];
    if (questionIndex < section.questions.length - 1) {
      setStep({ type: "question", sectionIndex, questionIndex: questionIndex + 1 });
    } else if (sectionIndex < questionnaire.sections.length - 1) {
      setStep({ type: "section-intro", sectionIndex: sectionIndex + 1 });
    } else {
      finishQuestionnaire();
    }
  }

  function goToNextQuestion(sectionIndex: number, questionIndex: number) {
    advanceAfterAnswer(sectionIndex, questionIndex);
  }

  function goToPreviousQuestion(sectionIndex: number, questionIndex: number) {
    if (questionIndex > 0) {
      setStep({ type: "question", sectionIndex, questionIndex: questionIndex - 1 });
    } else {
      setStep({ type: "section-intro", sectionIndex });
    }
  }

  function finishQuestionnaire() {
    if (answeredCount >= totalQuestions) {
      setStep({ type: "complete" });
    } else {
      setIncompleteDialogOpen(true);
    }
  }

  // ─── Button color styles ────────────────────────────────
  const t = questionnaire?.tenant;

  const startBtnStyle: React.CSSProperties | undefined = t?.startButtonColor
    ? { backgroundColor: t.startButtonColor, borderColor: t.startButtonColor, color: isLightColor(t.startButtonColor) ? "#1e293b" : "#ffffff" }
    : undefined;

  const prevBtnStyle: React.CSSProperties | undefined = t?.previousButtonColor
    ? { backgroundColor: t.previousButtonColor, borderColor: t.previousButtonColor, color: isLightColor(t.previousButtonColor) ? "#1e293b" : "#ffffff" }
    : undefined;

  const nextQBtnColor = t?.nextQuestionButtonColor || t?.startButtonColor || null;
  const nextQBtnStyle: React.CSSProperties | undefined = nextQBtnColor
    ? { backgroundColor: nextQBtnColor, borderColor: nextQBtnColor, color: isLightColor(nextQBtnColor) ? "#1e293b" : "#ffffff" }
    : undefined;

  const prevQBtnColor = t?.prevQuestionButtonColor || t?.previousButtonColor || null;
  const prevQBtnStyle: React.CSSProperties | undefined = prevQBtnColor
    ? { backgroundColor: prevQBtnColor, borderColor: prevQBtnColor, color: isLightColor(prevQBtnColor) ? "#1e293b" : "#ffffff" }
    : undefined;

  const stepNavStyle: React.CSSProperties = {
    backgroundColor: t?.stepNavBgColor || undefined,
    color: t?.stepNavTextColor || undefined,
  };

  const progressBarAreaStyle: React.CSSProperties = {
    backgroundColor: t?.progressBarBgColor || undefined,
    color: t?.progressBarTextColor || undefined,
  };

  const questionContainerStyle: React.CSSProperties = {
    backgroundColor: t?.questionContainerBgColor || undefined,
  };

  // ─── Render ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-3xl flex items-center gap-3 p-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="mx-auto max-w-3xl p-4 pt-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            {!online ? (
              <>
                <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Geen internetverbinding</CardTitle>
                <CardDescription>U bent offline en deze vragenlijst is nog niet eerder geladen.</CardDescription>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle>Vragenlijst niet gevonden</CardTitle>
                <CardDescription>De vragenlijst is niet gevonden of is niet gepubliceerd.</CardDescription>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ─── STEP: intro ────────────────────────────────────────
  if (step.type === "intro") {
    const introImageSrc = getIntroDisplayImageUrl(
      questionnaire.introImageUrl,
      resolveImageUrl,
    );

    return (
      <div className="min-h-screen bg-muted/50 flex flex-col" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <div className="flex-1 flex flex-col items-center pt-8 p-4">
          <div className="w-full max-w-2xl gacs-fade-up">
          <Card className="w-full text-center">
            {introImageSrc && (
              <div className="overflow-hidden flex justify-center gacs-fade-in">
                <img
                  src={introImageSrc}
                  alt=""
                  className="max-h-96 object-contain"
                  style={{ width: `${questionnaire.introImageScale ?? 100}%` }}
                />
              </div>
            )}
            <CardHeader className="pt-8 pb-2">
              <CardTitle className="text-2xl gacs-fade-in" style={{ animationDelay: "0.1s" }}>
                {questionnaire.introTitle || questionnaire.title}
              </CardTitle>
              <CardDescription className="text-base mt-2 whitespace-pre-line gacs-fade-in" style={{ animationDelay: "0.15s" }}>
                {questionnaire.introDescription || questionnaire.description || `Welkom bij de ${questionnaire.title}. Beantwoord de vragen per hoofdstuk om te controleren hoe ver u bent.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" />
                  {questionnaire.sections.length} hoofdstukken
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {totalQuestions} vragen
                </span>
                {questionnaire.estimatedMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ~{questionnaire.estimatedMinutes} min
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="text-lg px-10"
                style={startBtnStyle}
                onClick={() => setStep({ type: "section-intro", sectionIndex: 0 })}
              >
                Start de Check
                <ChevronRight className="h-5 w-5 gacs-arrow-nudge" />
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
        <div className="text-center py-4 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {questionnaire.tenant.name}
        </div>
      </div>
    );
  }

  // ─── STEP: section-intro ────────────────────────────────
  if (step.type === "section-intro") {
    const section = questionnaire.sections[step.sectionIndex];
    if (!section) { setStep({ type: "intro" }); return null; }

    const sectionImageSrc = getSectionDisplayImageUrl(
      section,
      step.sectionIndex,
      resolveImageUrl,
    );

    return (
      <div className="min-h-screen bg-muted/50 flex flex-col" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <StepNav
          sections={questionnaire.sections}
          currentSectionIndex={step.sectionIndex}
          onSelectSection={(idx) => setStep({ type: "section-intro", sectionIndex: idx })}
          style={stepNavStyle}
          answers={answers}
          activeIndicatorColor={t?.activeChapterIndicatorColor}
        />
        <div className="flex-1 flex flex-col items-center pt-8 p-4">
          <AnimatedCard stepKey={`sec-${step.sectionIndex}`} direction={navDirectionRef.current} className="w-full max-w-2xl">
          <Card className="w-full text-center">
            {sectionImageSrc && (
              <div className="overflow-hidden flex justify-center gacs-fade-in">
                <img
                  src={sectionImageSrc}
                  alt=""
                  className="max-h-96 object-contain"
                  style={{ width: `${section.imageScale ?? 100}%` }}
                />
              </div>
            )}
            <CardHeader className="pt-8 pb-2">
              <div className="flex items-center justify-center gap-3 mb-2 gacs-fade-in">
                <DynamicIcon name={section.icon} className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl gacs-fade-in" style={{ animationDelay: "0.05s" }}>
                {section.code && <span className="text-primary mr-1">{section.code}.</span>}
                {section.title}
              </CardTitle>
              {section.description && (
                <CardDescription className="text-base mt-2 whitespace-pre-line gacs-fade-in" style={{ animationDelay: "0.1s" }}>
                  {section.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <p className="text-sm text-muted-foreground">
                {section.questions.length} {section.questions.length === 1 ? "vraag" : "vragen"} in dit hoofdstuk
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  style={prevBtnStyle}
                  onClick={() => {
                    if (step.sectionIndex > 0) {
                      const prevSection = questionnaire.sections[step.sectionIndex - 1];
                      setStep({ type: "question", sectionIndex: step.sectionIndex - 1, questionIndex: prevSection.questions.length - 1 });
                    } else {
                      setStep({ type: "intro" });
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" /> Vorige
                </Button>
                <Button style={startBtnStyle} onClick={() => setStep({ type: "question", sectionIndex: step.sectionIndex, questionIndex: 0 })}>
                  Start <ChevronRight className="h-4 w-4 gacs-arrow-nudge" />
                </Button>
              </div>
            </CardContent>
          </Card>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // ─── STEP: question ─────────────────────────────────────
  if (step.type === "question") {
    const section = questionnaire.sections[step.sectionIndex];
    const question = section?.questions[step.questionIndex];
    if (!section || !question) { setStep({ type: "intro" }); return null; }

    const sectionQuestionCount = section.questions.length;
    const sectionAnsweredCount = section.questions.filter((q) => answers[q.id]).length;
    const sectionProgress = sectionQuestionCount > 0
      ? Math.round((sectionAnsweredCount / sectionQuestionCount) * 100)
      : 0;

    const isLastQuestionInSection = step.questionIndex >= section.questions.length - 1;
    const isLastSection = step.sectionIndex >= questionnaire.sections.length - 1;

    const groupedOptions = (() => {
      const hasGroups = question.options.some((o) => o.groupLabel);
      if (!hasGroups) return null;
      const groups: Record<string, Option[]> = {};
      for (const opt of question.options) {
        const g = opt.groupLabel || "Opties";
        if (!groups[g]) groups[g] = [];
        groups[g].push(opt);
      }
      return groups;
    })();

    const progressIndicatorStyle: React.CSSProperties = t?.progressBarColor
      ? { backgroundColor: t.progressBarColor }
      : {};

    return (
      <div className="min-h-screen bg-muted/50 flex flex-col" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <StepNav
          sections={questionnaire.sections}
          currentSectionIndex={step.sectionIndex}
          onSelectSection={(idx) => setStep({ type: "section-intro", sectionIndex: idx })}
          style={stepNavStyle}
          answers={answers}
          activeIndicatorColor={t?.activeChapterIndicatorColor}
        />

        <div className="border-b" style={progressBarAreaStyle}>
          <div className="mx-auto max-w-3xl px-4 py-2">
            <div className="flex items-center justify-between text-xs mb-1" style={progressBarAreaStyle.color ? { color: progressBarAreaStyle.color } : undefined}>
              <span>Vraag {step.questionIndex + 1} van {sectionQuestionCount} van het hoofdstuk</span>
            </div>
            <Progress value={sectionProgress} className="h-1.5" indicatorStyle={progressIndicatorStyle} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center pt-8 p-4">
          <AnimatedCard stepKey={`q-${step.sectionIndex}-${step.questionIndex}`} direction={navDirectionRef.current} className="w-full max-w-2xl">
          <Card className="w-full" style={questionContainerStyle}>
            <CardHeader>
              <CardTitle className="text-xl">{question.prompt}</CardTitle>
              {question.helpText && (
                <div className="mt-2 bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{question.helpText}</span>
                </div>
              )}
            </CardHeader>
            {question.imageUrl && (
              <div className="px-6 pb-2 flex justify-center">
                <img
                  src={resolveImageUrl(question.imageUrl)}
                  alt=""
                  className="max-h-96 object-contain"
                  style={{ width: `${question.imageScale ?? 100}%` }}
                />
              </div>
            )}
            <CardContent className="space-y-2 pb-6">
              {groupedOptions
                ? Object.entries(groupedOptions).map(([groupLabel, opts], gi) => (
                    <div key={groupLabel} className="space-y-2">
                      <Badge variant={groupLabel === "Niet toegestaan" ? "destructive" : "default"} className="text-xs gacs-fade-up"
                        style={{ animationDelay: `${gi * 60}ms` }}>
                        {groupLabel}
                      </Badge>
                      {opts.map((option, oi) => (
                        <OptionButton
                          key={option.id}
                          option={option}
                          selected={answers[question.id] === option.id}
                          animDelay={(gi * opts.length + oi) * 40 + 60}
                          onClick={() => {
                            handleAnswerSelect(question.id, option.id);
                            setTimeout(() => advanceAfterAnswer(step.sectionIndex, step.questionIndex), 400);
                          }}
                        />
                      ))}
                    </div>
                  ))
                : question.options.map((option, oi) => (
                    <OptionButton
                      key={option.id}
                      option={option}
                      selected={answers[question.id] === option.id}
                      animDelay={oi * 40 + 60}
                      onClick={() => {
                        handleAnswerSelect(question.id, option.id);
                        setTimeout(() => advanceAfterAnswer(step.sectionIndex, step.questionIndex), 400);
                      }}
                    />
                  ))}
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Nav buttons outside the card */}
          <div className="w-full max-w-2xl mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => goToPreviousQuestion(step.sectionIndex, step.questionIndex)}
              style={prevQBtnStyle}
            >
              <ChevronLeft className="h-4 w-4" /> Vorige vraag
            </Button>
            <Button
              onClick={() => {
                if (isLastQuestionInSection && isLastSection) {
                  finishQuestionnaire();
                } else {
                  goToNextQuestion(step.sectionIndex, step.questionIndex);
                }
              }}
              style={nextQBtnStyle}
            >
              {isLastQuestionInSection && isLastSection ? "Afronden" : "Vraag overslaan"} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: complete ─────────────────────────────────────
  if (step.type === "complete") {
    const completePdfSections = questionnaire.sections.map((sec) => ({
      title: sec.title, code: sec.code,
      questions: sec.questions.map((q) => {
        const sel = q.options.find((o) => o.id === answers[q.id]);
        return {
          code: q.code, prompt: q.prompt,
          selectedOption: sel ? { label: sel.label, groupLabel: sel.groupLabel, isAllowed: sel.isAllowed ?? null } : null,
          allowedOptions: q.options.filter((o) => o.isAllowed === true).map((o) => o.label),
        };
      }),
    }));
    const { overall: completeOverall, sectionScores: completeSectionScores } = computeScores(completePdfSections);
    const gradedSections = completeSectionScores.filter((s) => s.total > 0);
    const bestSection = gradedSections.length > 0 ? gradedSections.reduce((a, b) => (a.percentage >= b.percentage ? a : b)) : null;
    const worstSection = gradedSections.length > 0 ? gradedSections.reduce((a, b) => (a.percentage <= b.percentage ? a : b)) : null;
    const scoreColor = completeOverall >= 80 ? "text-green-600" : completeOverall >= 50 ? "text-amber-600" : "text-red-600";
    const hasGradedQuestions = gradedSections.length > 0;

    return (
      <div className="min-h-screen bg-muted/50 flex flex-col" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <div className="flex-1 flex flex-col items-center pt-8 p-4">
          <div className="w-full max-w-2xl gacs-fade-up">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{questionnaire.completionTitle || "Klaar!"}</CardTitle>
              <CardDescription>
                {questionnaire.completionDescription || "U kunt hieronder een PDF downloaden met al uw antwoorden."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasGradedQuestions && (
                <div className="border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">Uw resultaat</span>
                    </div>
                    <span className={`text-2xl font-bold ${scoreColor}`}>{completeOverall}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {bestSection && (
                      <div className="bg-green-50 border border-green-200 p-2.5">
                        <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium mb-0.5">
                          <TrendingUp className="h-3.5 w-3.5" /> Beste hoofdstuk
                        </div>
                        <p className="text-sm font-semibold text-green-800 truncate">{bestSection.title}</p>
                        <p className="text-xs text-green-600">{bestSection.percentage}%</p>
                      </div>
                    )}
                    {worstSection && (
                      <div className="bg-red-50 border border-red-200 p-2.5">
                        <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium mb-0.5">
                          <TrendingDown className="h-3.5 w-3.5" /> Aandachtspunt
                        </div>
                        <p className="text-sm font-semibold text-red-800 truncate">{worstSection.title}</p>
                        <p className="text-xs text-red-600">{worstSection.percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {finalizeError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {finalizeError}
                </p>
              )}
              {finalizeMutation.isPending && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Inzending wordt opgeslagen...
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" style={prevBtnStyle} onClick={() => {
                  const lastSec = questionnaire.sections.length - 1;
                  const lastQ = questionnaire.sections[lastSec].questions.length - 1;
                  setStep({ type: "question", sectionIndex: lastSec, questionIndex: lastQ });
                }}>
                  <ChevronLeft className="h-4 w-4" /> Terug
                </Button>
                <Button
                  style={startBtnStyle}
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex-1"
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              </div>
              {!online && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Opslaan vereist een internetverbinding.
                </p>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── Incomplete dialog ─────────────────────────────────
  return (
    <Dialog open={incompleteDialogOpen} onOpenChange={setIncompleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Niet alle vragen beantwoord
          </DialogTitle>
          <DialogDescription>
            U heeft {answeredCount} van de {totalQuestions} vragen beantwoord.
            Wilt u toch doorgaan of de ontbrekende vragen beantwoorden?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {unansweredBySection.map((s) => (
            <div key={s.section.id} className="text-sm">
              <span className="font-medium">{s.section.title}</span>
              <span className="text-muted-foreground ml-1">({s.questions.length} ontbrekend)</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIncompleteDialogOpen(false)}>
            Terug naar vragen
          </Button>
          <Button onClick={() => {
            setIncompleteDialogOpen(false);
            setStep({ type: "complete" });
          }}>
            Toch doorgaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────

function AnimatedCard({ stepKey, direction, children, className }: { stepKey: string; direction: "fwd" | "back"; children: React.ReactNode; className?: string }) {
  const [animClass, setAnimClass] = useState("gacs-slide-fwd");

  useEffect(() => {
    setAnimClass("");
    const cls = direction === "back" ? "gacs-slide-back" : "gacs-slide-fwd";
    const frame = requestAnimationFrame(() => setAnimClass(cls));
    return () => cancelAnimationFrame(frame);
  }, [stepKey, direction]);

  return (
    <div className={`${className ?? ""} ${animClass}`}>
      {children}
    </div>
  );
}

function OptionButton({ option, selected, onClick, animDelay = 0 }: { option: Option; selected: boolean; onClick: () => void; animDelay?: number }) {
  const [justSelected, setJustSelected] = useState(false);

  function handleClick() {
    onClick();
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 400);
  }

  return (
    <button
      onClick={handleClick}
      className={`gacs-fade-up w-full text-left border-2 p-4 transition-all duration-200 ${
        justSelected
          ? "border-primary bg-primary/10 shadow-md"
          : selected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
      }`}
      style={{
        animationDelay: `${animDelay}ms`,
        transform: justSelected ? "scale(1.02)" : undefined,
        transition: "border-color 200ms, background-color 200ms, box-shadow 200ms, transform 200ms ease-out",
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          selected || justSelected ? "border-primary" : "border-muted-foreground/40"
        }`}>
          {(selected || justSelected) && (
            <div className="h-2.5 w-2.5 rounded-full bg-primary transition-transform duration-200"
              style={{ transform: justSelected ? "scale(1.3)" : "scale(1)" }} />
          )}
        </div>
        <span className={`text-sm transition-colors duration-200 ${selected || justSelected ? "font-medium text-primary" : ""}`}>
          {option.label}
        </span>
      </div>
    </button>
  );
}

function Header({ tenant }: { tenant: Questionnaire["tenant"] }) {
  const hasBranding = !!tenant.primaryColor;
  const textColor = tenant.headerTextColor || (hasBranding ? (isLightColor(tenant.primaryColor!) ? "#1e293b" : "#ffffff") : undefined);
  const headerStyle: React.CSSProperties = hasBranding ? { backgroundColor: tenant.primaryColor!, color: textColor } : {};
  const base = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
  const logoSrc = tenant.logoUrl?.startsWith("/api/") ? `${base}${tenant.logoUrl}` : tenant.logoUrl;
  const hasName = !!tenant.name;
  const logoOnly = logoSrc && !hasName;

  return (
    <header className={hasBranding ? "shadow-sm" : "border-b bg-background"} style={headerStyle}>
      <div className={`mx-auto max-w-5xl flex items-center gap-3 p-4 ${logoOnly ? "justify-center" : ""}`}>
        {logoSrc ? (
          <img src={logoSrc} alt={tenant.name || ""} className="object-contain" style={{ width: "25%" }} />
        ) : hasBranding && hasName ? (
          <div className="h-8 w-8 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            {tenant.name[0]}
          </div>
        ) : null}
        {hasName && <span className="font-semibold text-lg">{tenant.name}</span>}
      </div>
    </header>
  );
}

function StepNav({
  sections,
  currentSectionIndex,
  onSelectSection,
  style,
  answers,
  activeIndicatorColor,
}: {
  sections: Section[];
  currentSectionIndex: number;
  onSelectSection: (idx: number) => void;
  style?: React.CSSProperties;
  answers: Record<string, string>;
  activeIndicatorColor?: string | null;
}) {
  const current = sections[currentSectionIndex];
  const label = current
    ? `${current.code ? current.code + ". " : ""}${current.title}`
    : "";

  function isSectionComplete(sec: Section) {
    return sec.questions.length > 0 && sec.questions.every((q) => answers[q.id]);
  }

  return (
    <div className="bg-background/95 backdrop-blur" style={{ borderBottom: "2px solid var(--border)", ...style }}>
      <div className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap">
          Hoofdstuk {currentSectionIndex + 1} van {sections.length}
        </span>

        <Select
          value={String(currentSectionIndex)}
          onValueChange={(val) => onSelectSection(Number(val))}
        >
          <SelectTrigger className="flex-1 h-9 text-sm min-w-0">
            <SelectValue>{label}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4}>
            {sections.map((sec, idx) => (
              <SelectItem
                key={sec.id}
                value={String(idx)}
                hideIndicator
                rightSlot={
                  isSectionComplete(sec)
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : idx === currentSectionIndex
                      ? <Circle className={`h-3 w-3 ${activeIndicatorColor ? "" : "fill-primary text-primary"}`} style={activeIndicatorColor ? { fill: activeIndicatorColor, color: activeIndicatorColor } : undefined} />
                      : null
                }
              >
                <span className="flex items-center gap-2">
                  <DynamicIcon name={sec.icon} className="h-4 w-4 flex-shrink-0" />
                  <span>{sec.code ? `${sec.code}. ` : ""}{sec.title}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function hexToHSL(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}
