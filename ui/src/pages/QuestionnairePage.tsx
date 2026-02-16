import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { emailSubmissionSchema } from '@/lib/schemas';
import {
  cacheQuestionnaire,
  getCachedQuestionnaire,
  enqueue,
  processQueue,
  getQueueLength,
  isOnline,
  onConnectivityChange,
} from '@/lib/offline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, AlertCircle, Download, WifiOff, RefreshCw } from 'lucide-react';
import { generateSubmissionPdf, buildPdfFilename } from '@/lib/pdf';
import type { PdfData } from '@/lib/pdf';

interface Option {
  id: string;
  label: string;
  groupLabel: string | null;
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

export function QuestionnairePage() {
  const { tenantSlug, questionnaireSlug } = useParams<{ tenantSlug: string; questionnaireSlug: string }>();

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
    } catch { /* ignore corrupt data */ }
    return null;
  }, [storageKey]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(savedDraft?.sectionIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedDraft?.answers ?? {});
  const [submissionId, setSubmissionId] = useState<string | null>(savedDraft?.submissionId ?? null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Persist draft to localStorage whenever answers, submissionId or section changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers, submissionId, sectionIndex: currentSectionIndex }),
      );
    } catch { /* storage full / unavailable – silently ignore */ }
  }, [answers, submissionId, currentSectionIndex, storageKey]);

  // Clear localStorage after successful submission
  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  // Offline status
  const [online, setOnline] = useState(isOnline());
  const [pendingOps, setPendingOps] = useState(getQueueLength());
  const [syncing, setSyncing] = useState(false);

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
  const { data: fetchedQuestionnaire, isLoading, error } = useQuery<Questionnaire>({
    queryKey: ['questionnaire', tenantSlug, questionnaireSlug],
    queryFn: async () => {
      const { data } = await api.get(`/public/${tenantSlug}/${questionnaireSlug}`);
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
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
        // Set foreground color based on contrast
        const fg = isLightColor(primaryColor) ? '222 47% 11%' : '210 40% 98%';
        document.documentElement.style.setProperty('--primary-foreground', fg);
      }
      if (secondaryColor) {
        const hsl = hexToHSL(secondaryColor);
        document.documentElement.style.setProperty('--accent', hsl);
      }
      // Apply favicon
      if (faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
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
      const { data } = await api.post('/submissions/start', { questionnaireId });
      return data;
    },
    onSuccess: (data) => setSubmissionId(data.id),
    onError: () => {
      // Offline: create a temporary local submission ID
      if (questionnaire && !submissionId) {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSubmissionId(tempId);
        enqueue({
          type: 'start_submission',
          payload: { questionnaireId: questionnaire.id, tempId },
        });
        setPendingOps(getQueueLength());
      }
    },
  });

  useEffect(() => {
    if (questionnaire && !submissionId) {
      startMutation.mutate(questionnaire.id);
    }
  }, [questionnaire]);

  // Save answer (with offline queue fallback)
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string }) => {
      if (!submissionId) return;
      // Don't try API for local submissions – queue directly
      if (submissionId.startsWith('local-')) {
        throw new Error('offline');
      }
      await api.post(`/submissions/${submissionId}/answers`, { questionId, selectedOptionId });
    },
    onError: (_err, variables) => {
      // Queue for later sync
      if (submissionId) {
        enqueue({
          type: 'save_answer',
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
    if (!submissionId.startsWith('local-')) {
      for (const [questionId, selectedOptionId] of Object.entries(savedAnswers)) {
        saveAnswerMutation.mutate({ questionId, selectedOptionId });
      }
    }
    setHasReplayedAnswers(true);
  }, [submissionId]);

  const handleAnswerSelect = useCallback(
    (questionId: string, optionId: string) => {
      // Always save locally first (localStorage persisted via the useEffect above)
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      // Then attempt API save (will queue on failure)
      saveAnswerMutation.mutate({ questionId, selectedOptionId: optionId });
    },
    [submissionId],
  );

  // Submit email (handles stale / already-finalized submissions automatically)
  const emailMutation = useMutation({
    mutationFn: async () => {
      let sid = submissionId;

      if (!sid || sid.startsWith('local-')) {
        // No valid submission yet – create one
        if (!questionnaire) throw new Error('Vragenlijst niet geladen.');
        const { data } = await api.post('/submissions/start', { questionnaireId: questionnaire.id });
        sid = data.id;
        setSubmissionId(sid);
        // Replay all local answers to the new submission
        for (const [questionId, selectedOptionId] of Object.entries(answers)) {
          await api.post(`/submissions/${sid}/answers`, { questionId, selectedOptionId });
        }
      }

      try {
        await api.post(`/submissions/${sid}/email`, { email, consentGiven: true });
      } catch (err: any) {
        const errMsg: string = err?.response?.data?.message || '';
        // If the old submission was already finalized, create a fresh one and retry
        if (errMsg.toLowerCase().includes('already finalized') || errMsg.toLowerCase().includes('already consumed')) {
          if (!questionnaire) throw new Error('Vragenlijst niet geladen.');
          const { data } = await api.post('/submissions/start', { questionnaireId: questionnaire.id });
          sid = data.id;
          setSubmissionId(sid);
          // Replay all local answers to the new submission
          for (const [questionId, selectedOptionId] of Object.entries(answers)) {
            await api.post(`/submissions/${sid}/answers`, { questionId, selectedOptionId });
          }
          await api.post(`/submissions/${sid}/email`, { email, consentGiven: true });
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
      const msg = (error as any)?.response?.data?.message || error.message || 'Er is een fout opgetreden bij het verzenden.';
      setEmailError(msg);
    },
  });

  const handleEmailSubmit = useCallback(() => {
    const result = emailSubmissionSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }
    setEmailError('');
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
        questions: section.questions.map((q) => ({
          code: q.code,
          prompt: q.prompt,
          selectedOption: answers[q.id]
            ? { label: q.options.find((o) => o.id === answers[q.id])?.label ?? '', groupLabel: q.options.find((o) => o.id === answers[q.id])?.groupLabel ?? null }
            : null,
        })),
      })),
    };
    const doc = generateSubmissionPdf(pdfData);
    doc.save(buildPdfFilename(questionnaire.title));
  }, [questionnaire, answers]);

  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const currentSection = questionnaire?.sections[currentSectionIndex];
  const totalSections = questionnaire?.sections.length || 0;
  const totalQuestions = questionnaire?.sections.reduce((sum, s) => sum + s.questions.length, 0) || 0;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const allCurrentSectionAnswered = useMemo(() => {
    if (!currentSection) return false;
    return currentSection.questions.every((q) => answers[q.id]);
  }, [currentSection, answers]);

  const isLastSection = currentSectionIndex === totalSections - 1;

  // Compute page background from branding
  const pageBackground: React.CSSProperties = questionnaire?.tenant?.secondaryColor
    ? { backgroundColor: questionnaire.tenant.secondaryColor }
    : {};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  De vragenlijst is niet gevonden of is niet gepubliceerd. Controleer de URL en probeer opnieuw.
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
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" style={pageBackground}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>Verificatie-e-mail verzonden</CardTitle>
            <CardDescription>
              We hebben een verificatie-e-mail gestuurd naar <strong>{email}</strong>.
              Klik op de link in de e-mail om uw inzending te voltooien.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-muted/50" style={pageBackground}>
        <Header tenant={questionnaire.tenant} />
        <div className="mx-auto max-w-2xl p-4 pt-8">
          <Card>
            <CardHeader>
              <CardTitle>Bijna klaar!</CardTitle>
              <CardDescription>
                Voer uw e-mailadres in om uw inzending te voltooien. U ontvangt een verificatie-e-mail.
                Na verificatie ontvangt u een PDF met al uw ingevulde antwoorden.
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
                    if (emailError) setEmailError('');
                  }}
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>
              <div className="flex items-start space-x-3 rounded-md border p-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                  Ik ga akkoord met de verwerking van mijn e-mailadres en antwoorden door de organisatie die deze
                  vragenlijst heeft opgesteld, ten behoeve van analyse en rapportage. Mijn gegevens worden bewaard
                  volgens het retentiebeleid van de organisatie. Ik heb recht op inzage, rectificatie en verwijdering
                  van mijn gegevens conform de AVG (GDPR).{' '}
                  <a href="/gdpr/erasure" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">
                    Verwijderingsverzoek indienen
                  </a>
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEmailForm(false)}>
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
                  Verificatie vereist een internetverbinding. Uw antwoorden zijn lokaal opgeslagen.
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
      {(!online || isOfflineMode || pendingOps > 0) && (
        <div className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${online ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
          {!online ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>U bent offline. Uw antwoorden worden lokaal opgeslagen en gesynchroniseerd wanneer u weer online bent.</span>
            </>
          ) : pendingOps > 0 ? (
            <>
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchroniseren...' : `${pendingOps} wijziging(en) wachten op synchronisatie.`}</span>
              {!syncing && (
                <button onClick={syncQueue} className="underline font-medium ml-1">Nu synchroniseren</button>
              )}
            </>
          ) : isOfflineMode ? (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Geladen vanuit cache. Sommige gegevens zijn mogelijk niet actueel.</span>
            </>
          ) : null}
        </div>
      )}

      <div className="mx-auto max-w-3xl p-4 pt-8 space-y-6">
        {/* Title & Progress */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
          {questionnaire.description && (
            <p className="text-muted-foreground" style={questionnaire.tenant.subtextColor ? { color: questionnaire.tenant.subtextColor } : undefined}>{questionnaire.description}</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Progress value={progressPercent} className="flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {answeredCount}/{totalQuestions} vragen
            </span>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {questionnaire.sections.map((section, idx) => {
            const sectionAnswered = section.questions.every((q) => answers[q.id]);
            return (
              <Button
                key={section.id}
                variant={idx === currentSectionIndex ? 'default' : sectionAnswered ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setCurrentSectionIndex(idx);
                  setTimeout(scrollToSection, 100);
                }}
              >
                {section.code && `${section.code}. `}
                {section.title.length > 25 ? section.title.substring(0, 25) + '...' : section.title}
                {sectionAnswered && <CheckCircle2 className="h-3 w-3 ml-1" />}
              </Button>
            );
          })}
        </div>

        {/* Current Section */}
        {currentSection && (
          <Card ref={sectionRef}>
            <CardHeader>
              <CardTitle className="text-xl">
                {currentSection.code && (
                  <span className="text-primary mr-2">{currentSection.code}.</span>
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
                  onSelect={(optionId) => handleAnswerSelect(question.id, optionId)}
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

          {isLastSection ? (
            <Button onClick={() => setShowEmailForm(true)} disabled={answeredCount < totalQuestions}>
              Afronden <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => {
              setCurrentSectionIndex((i) => Math.min(totalSections - 1, i + 1));
              setTimeout(scrollToSection, 100);
            }}>
              Volgende <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ tenant }: { tenant: Questionnaire['tenant'] }) {
  const hasBranding = !!tenant.primaryColor;
  const textColor = tenant.headerTextColor
    || (hasBranding ? (isLightColor(tenant.primaryColor!) ? '#1e293b' : '#ffffff') : undefined);
  const headerStyle: React.CSSProperties = hasBranding
    ? { backgroundColor: tenant.primaryColor!, color: textColor }
    : {};

  return (
    <header className={hasBranding ? 'shadow-sm' : 'border-b bg-background'} style={headerStyle}>
      <div className="mx-auto max-w-3xl flex items-center gap-3 p-4">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="h-8 w-8 rounded object-contain"
            style={hasBranding ? { backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px' } : undefined}
          />
        ) : hasBranding ? (
          <div
            className="h-8 w-8 rounded flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {tenant.name?.[0] || 'G'}
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
      const group = opt.groupLabel || 'Opties';
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [question.options]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium">
          {question.code && <span className="text-primary mr-1">{question.code}</span>}
          {question.prompt}
          {question.isRequired && <span className="text-destructive ml-1">*</span>}
        </h4>
        {question.helpText && (
          <p className="text-sm text-muted-foreground mt-1" style={subtextColor ? { color: subtextColor } : undefined}>{question.helpText}</p>
        )}
      </div>

      <RadioGroup value={selectedOptionId} onValueChange={onSelect}>
        {groupedOptions ? (
          Object.entries(groupedOptions).map(([groupLabel, options]) => (
            <div key={groupLabel} className="space-y-2">
              <Badge
                variant={groupLabel === 'Niet toegestaan' ? 'destructive' : 'default'}
                className="text-xs"
              >
                {groupLabel}
              </Badge>
              {options.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 py-1">
                  <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                  <Label htmlFor={option.id} className="font-normal leading-snug cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          ))
        ) : (
          question.options.map((option) => (
            <div key={option.id} className="flex items-start space-x-3 py-1">
              <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
              <Label htmlFor={option.id} className="font-normal leading-snug cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))
        )}
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
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
