import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  brandingSchema,
  getFieldErrors,
  type BrandingData,
  type FieldErrors,
} from "@/lib/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { Eye, Palette, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

interface TenantBranding {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  headerTextColor: string;
  subtextColor: string;
  startButtonColor: string;
  previousButtonColor: string;
  nextQuestionButtonColor: string;
  prevQuestionButtonColor: string;
  stepNavBgColor: string;
  stepNavTextColor: string;
  progressBarBgColor: string;
  progressBarColor: string;
  progressBarTextColor: string;
  questionContainerBgColor: string;
  activeChapterIndicatorColor: string;
  logoUrl: string;
  faviconUrl: string;
  notificationEmail: string;
  verificationEmailTemplate: string;
}

const DEFAULT_VERIFICATION_EMAIL_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>E-mailverificatie</h2>
  <p>Bedankt voor het invullen van de vragenlijst bij {{tenantName}}.</p>
  <p>Klik op de onderstaande link om uw e-mailadres te verifiëren en uw inzending te voltooien:</p>
  <p style="margin: 24px 0;">
    <a href="{{verificationUrl}}" style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
      Verifieer e-mailadres
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Deze link is 24 uur geldig. Als u deze verificatie niet heeft aangevraagd, kunt u deze e-mail negeren.
  </p>
</div>`;

function renderTemplatePreview(template: string, tenantName: string): string {
  return template
    .replace(/\{\{tenantName\}\}/g, tenantName || "Your Organization")
    .replace(/\{\{verificationUrl\}\}/g, "https://example.com/verify?token=...")
    .replace(/\{\{recipientEmail\}\}/g, "respondent@example.com");
}

export default function BrandingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const editorRef = useRef<any>(null);

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#003366");
  const [secondaryColor, setSecondaryColor] = useState("#e8f0fe");
  const [headerTextColor, setHeaderTextColor] = useState("#ffffff");
  const [subtextColor, setSubtextColor] = useState("#cccccc");
  const [startButtonColor, setStartButtonColor] = useState("");
  const [previousButtonColor, setPreviousButtonColor] = useState("");
  const [nextQuestionButtonColor, setNextQuestionButtonColor] = useState("");
  const [prevQuestionButtonColor, setPrevQuestionButtonColor] = useState("");
  const [stepNavBgColor, setStepNavBgColor] = useState("");
  const [stepNavTextColor, setStepNavTextColor] = useState("");
  const [progressBarBgColor, setProgressBarBgColor] = useState("");
  const [progressBarColor, setProgressBarColor] = useState("");
  const [progressBarTextColor, setProgressBarTextColor] = useState("");
  const [questionContainerBgColor, setQuestionContainerBgColor] = useState("");
  const [activeChapterIndicatorColor, setActiveChapterIndicatorColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [verificationEmailTemplate, setVerificationEmailTemplate] = useState(
    DEFAULT_VERIFICATION_EMAIL_TEMPLATE,
  );
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<BrandingData>>({});

  const { data: branding, isLoading } = useQuery<TenantBranding>({
    queryKey: ["tenant-branding", user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  useEffect(() => {
    if (branding) {
      setName(branding.name || "");
      setPrimaryColor(branding.primaryColor || "#003366");
      setSecondaryColor(branding.secondaryColor || "#e8f0fe");
      setHeaderTextColor(branding.headerTextColor || "#ffffff");
      setSubtextColor(branding.subtextColor || "#cccccc");
      setStartButtonColor(branding.startButtonColor || "");
      setPreviousButtonColor(branding.previousButtonColor || "");
      setNextQuestionButtonColor(branding.nextQuestionButtonColor || "");
      setPrevQuestionButtonColor(branding.prevQuestionButtonColor || "");
      setStepNavBgColor(branding.stepNavBgColor || "");
      setStepNavTextColor(branding.stepNavTextColor || "");
      setProgressBarBgColor(branding.progressBarBgColor || "");
      setProgressBarColor(branding.progressBarColor || "");
      setProgressBarTextColor(branding.progressBarTextColor || "");
      setQuestionContainerBgColor(branding.questionContainerBgColor || "");
      setActiveChapterIndicatorColor(branding.activeChapterIndicatorColor || "");
      setLogoUrl(branding.logoUrl || "");
      setFaviconUrl(branding.faviconUrl || "");
      setNotificationEmail(branding.notificationEmail || "");
      setVerificationEmailTemplate(
        branding.verificationEmailTemplate ||
          DEFAULT_VERIFICATION_EMAIL_TEMPLATE,
      );
    }
  }, [branding]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/tenants/${user!.tenantId}`, {
        name,
        primaryColor,
        secondaryColor,
        headerTextColor: headerTextColor || undefined,
        subtextColor: subtextColor || undefined,
        startButtonColor: startButtonColor || undefined,
        previousButtonColor: previousButtonColor || undefined,
        nextQuestionButtonColor: nextQuestionButtonColor || undefined,
        prevQuestionButtonColor: prevQuestionButtonColor || undefined,
        stepNavBgColor: stepNavBgColor || undefined,
        stepNavTextColor: stepNavTextColor || undefined,
        progressBarBgColor: progressBarBgColor || undefined,
        progressBarColor: progressBarColor || undefined,
        progressBarTextColor: progressBarTextColor || undefined,
        questionContainerBgColor: questionContainerBgColor || undefined,
        activeChapterIndicatorColor: activeChapterIndicatorColor || undefined,
        logoUrl,
        faviconUrl,
        notificationEmail: notificationEmail || undefined,
        verificationEmailTemplate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function submitChanges() {
    const result = getFieldErrors(brandingSchema, {
      name,
      primaryColor,
      secondaryColor,
      headerTextColor: headerTextColor || undefined,
      subtextColor: subtextColor || undefined,
      startButtonColor: startButtonColor || undefined,
      previousButtonColor: previousButtonColor || undefined,
      nextQuestionButtonColor: nextQuestionButtonColor || undefined,
      prevQuestionButtonColor: prevQuestionButtonColor || undefined,
      stepNavBgColor: stepNavBgColor || undefined,
      stepNavTextColor: stepNavTextColor || undefined,
      progressBarBgColor: progressBarBgColor || undefined,
      progressBarColor: progressBarColor || undefined,
      progressBarTextColor: progressBarTextColor || undefined,
      questionContainerBgColor: questionContainerBgColor || undefined,
      activeChapterIndicatorColor: activeChapterIndicatorColor || undefined,
      logoUrl: logoUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      notificationEmail: notificationEmail || undefined,
      verificationEmailTemplate,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Branding</h2>
        <p className="text-muted-foreground">
          Customize the look and feel of your questionnaire pages
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding Settings
                </CardTitle>
                <CardDescription>
                  Update your tenant branding and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name (optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name)
                        setFieldErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="Your Organization"
                    className={fieldErrors.name ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to show only the logo (centered)</p>
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          if (fieldErrors.primaryColor)
                            setFieldErrors((p) => ({
                              ...p,
                              primaryColor: undefined,
                            }));
                        }}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          if (fieldErrors.primaryColor)
                            setFieldErrors((p) => ({
                              ...p,
                              primaryColor: undefined,
                            }));
                        }}
                        placeholder="#003366"
                        className={
                          fieldErrors.primaryColor ? "border-destructive" : ""
                        }
                      />
                    </div>
                    {fieldErrors.primaryColor && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.primaryColor}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          if (fieldErrors.secondaryColor)
                            setFieldErrors((p) => ({
                              ...p,
                              secondaryColor: undefined,
                            }));
                        }}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          if (fieldErrors.secondaryColor)
                            setFieldErrors((p) => ({
                              ...p,
                              secondaryColor: undefined,
                            }));
                        }}
                        placeholder="#e8f0fe"
                        className={
                          fieldErrors.secondaryColor ? "border-destructive" : ""
                        }
                      />
                    </div>
                    {fieldErrors.secondaryColor && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.secondaryColor}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headerTextColor">Header Text Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="headerTextColor"
                        value={headerTextColor}
                        onChange={(e) => {
                          setHeaderTextColor(e.target.value);
                          if (fieldErrors.headerTextColor)
                            setFieldErrors((p) => ({
                              ...p,
                              headerTextColor: undefined,
                            }));
                        }}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={headerTextColor}
                        onChange={(e) => {
                          setHeaderTextColor(e.target.value);
                          if (fieldErrors.headerTextColor)
                            setFieldErrors((p) => ({
                              ...p,
                              headerTextColor: undefined,
                            }));
                        }}
                        placeholder="#ffffff"
                        className={
                          fieldErrors.headerTextColor
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                    {fieldErrors.headerTextColor && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.headerTextColor}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtextColor">Subtext Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="subtextColor"
                        value={subtextColor}
                        onChange={(e) => {
                          setSubtextColor(e.target.value);
                          if (fieldErrors.subtextColor)
                            setFieldErrors((p) => ({
                              ...p,
                              subtextColor: undefined,
                            }));
                        }}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={subtextColor}
                        onChange={(e) => {
                          setSubtextColor(e.target.value);
                          if (fieldErrors.subtextColor)
                            setFieldErrors((p) => ({
                              ...p,
                              subtextColor: undefined,
                            }));
                        }}
                        placeholder="#cccccc"
                        className={
                          fieldErrors.subtextColor ? "border-destructive" : ""
                        }
                      />
                    </div>
                    {fieldErrors.subtextColor && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.subtextColor}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startButtonColor">Start Button Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="startButtonColor"
                        value={startButtonColor || primaryColor}
                        onChange={(e) => setStartButtonColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={startButtonColor}
                        onChange={(e) => setStartButtonColor(e.target.value)}
                        placeholder="Defaults to primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Color for "Start" and "Volgende" buttons
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previousButtonColor">Previous Button Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="previousButtonColor"
                        value={previousButtonColor || "#6b7280"}
                        onChange={(e) => setPreviousButtonColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={previousButtonColor}
                        onChange={(e) => setPreviousButtonColor(e.target.value)}
                        placeholder="Defaults to gray"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Color for "Vorige" buttons
                    </p>
                  </div>
                </div>

                <Separator />
                <h4 className="text-sm font-semibold pt-2">Vorige/Volgende vraag knoppen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextQuestionButtonColor">Volgende Vraag Color</Label>
                    <div className="flex gap-2">
                      <input type="color" id="nextQuestionButtonColor" value={nextQuestionButtonColor || primaryColor}
                        onChange={(e) => setNextQuestionButtonColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={nextQuestionButtonColor}
                        onChange={(e) => setNextQuestionButtonColor(e.target.value)}
                        placeholder="Defaults to primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">Text color for "Volgende vraag"</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prevQuestionButtonColor">Vorige Vraag Color</Label>
                    <div className="flex gap-2">
                      <input type="color" id="prevQuestionButtonColor" value={prevQuestionButtonColor || "#6b7280"}
                        onChange={(e) => setPrevQuestionButtonColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={prevQuestionButtonColor}
                        onChange={(e) => setPrevQuestionButtonColor(e.target.value)}
                        placeholder="Defaults to gray" />
                    </div>
                    <p className="text-xs text-muted-foreground">Text color for "Vorige vraag"</p>
                  </div>
                </div>

                <Separator />
                <h4 className="text-sm font-semibold pt-2">Hoofdstuk navigatie balk</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stepNavBgColor">Achtergrondkleur</Label>
                    <div className="flex gap-2">
                      <input type="color" id="stepNavBgColor" value={stepNavBgColor || "#ffffff"}
                        onChange={(e) => setStepNavBgColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={stepNavBgColor}
                        onChange={(e) => setStepNavBgColor(e.target.value)}
                        placeholder="Defaults to white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stepNavTextColor">Tekstkleur</Label>
                    <div className="flex gap-2">
                      <input type="color" id="stepNavTextColor" value={stepNavTextColor || "#374151"}
                        onChange={(e) => setStepNavTextColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={stepNavTextColor}
                        onChange={(e) => setStepNavTextColor(e.target.value)}
                        placeholder="Defaults to dark" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activeChapterIndicatorColor">Actief hoofdstuk indicator kleur</Label>
                  <div className="flex gap-2">
                    <input type="color" id="activeChapterIndicatorColor" value={activeChapterIndicatorColor || primaryColor}
                      onChange={(e) => setActiveChapterIndicatorColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border p-1" />
                    <Input value={activeChapterIndicatorColor}
                      onChange={(e) => setActiveChapterIndicatorColor(e.target.value)}
                      placeholder="Defaults to primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Color of the filled dot next to the active chapter in the dropdown</p>
                </div>

                <Separator />
                <h4 className="text-sm font-semibold pt-2">Voortgangsbalk</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="progressBarBgColor">Achtergrond</Label>
                    <div className="flex gap-2">
                      <input type="color" id="progressBarBgColor" value={progressBarBgColor || "#ffffff"}
                        onChange={(e) => setProgressBarBgColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={progressBarBgColor}
                        onChange={(e) => setProgressBarBgColor(e.target.value)}
                        placeholder="#ffffff" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="progressBarColor">Balk kleur</Label>
                    <div className="flex gap-2">
                      <input type="color" id="progressBarColor" value={progressBarColor || primaryColor}
                        onChange={(e) => setProgressBarColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={progressBarColor}
                        onChange={(e) => setProgressBarColor(e.target.value)}
                        placeholder="Primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="progressBarTextColor">Tekstkleur</Label>
                    <div className="flex gap-2">
                      <input type="color" id="progressBarTextColor" value={progressBarTextColor || "#6b7280"}
                        onChange={(e) => setProgressBarTextColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border p-1" />
                      <Input value={progressBarTextColor}
                        onChange={(e) => setProgressBarTextColor(e.target.value)}
                        placeholder="#6b7280" />
                    </div>
                  </div>
                </div>

                <Separator />
                <h4 className="text-sm font-semibold pt-2">Vragencontainer</h4>
                <div className="space-y-2">
                  <Label htmlFor="questionContainerBgColor">Achtergrondkleur</Label>
                  <div className="flex gap-2">
                    <input type="color" id="questionContainerBgColor" value={questionContainerBgColor || "#ffffff"}
                      onChange={(e) => setQuestionContainerBgColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border p-1" />
                    <Input value={questionContainerBgColor}
                      onChange={(e) => setQuestionContainerBgColor(e.target.value)}
                      placeholder="Defaults to white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Background color of the card containing questions and answers</p>
                </div>

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <ImageUpload
                      value={logoUrl || null}
                      onChange={(url) => {
                        setLogoUrl(url || "");
                        if (fieldErrors.logoUrl)
                          setFieldErrors((p) => ({ ...p, logoUrl: undefined }));
                      }}
                    />
                    {fieldErrors.logoUrl && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.logoUrl}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <ImageUpload
                      value={faviconUrl || null}
                      onChange={(url) => {
                        setFaviconUrl(url || "");
                        if (fieldErrors.faviconUrl)
                          setFieldErrors((p) => ({ ...p, faviconUrl: undefined }));
                      }}
                    />
                    {fieldErrors.faviconUrl && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.faviconUrl}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">
                    Notification Email for New Submissions
                  </Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => {
                      setNotificationEmail(e.target.value);
                      if (fieldErrors.notificationEmail)
                        setFieldErrors((p) => ({
                          ...p,
                          notificationEmail: undefined,
                        }));
                    }}
                    placeholder="tenant@example.com"
                    className={
                      fieldErrors.notificationEmail ? "border-destructive" : ""
                    }
                  />
                  {fieldErrors.notificationEmail && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.notificationEmail}
                    </p>
                  )}
                </div>

                <Button
                  onClick={submitChanges}
                  disabled={saveMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending
                    ? "Saving..."
                    : saved
                      ? "Saved!"
                      : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
                <CardDescription>
                  How your branding will appear to respondents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border overflow-hidden text-sm">
                  {/* Header */}
                  <div
                    className="p-3 flex items-center gap-2"
                    style={{
                      backgroundColor: primaryColor,
                      color: headerTextColor || "#fff",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-6 w-6 object-contain bg-white/20 p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-6 w-6 bg-white/20 flex items-center justify-center text-xs font-bold">
                        {name?.[0] || "G"}
                      </div>
                    )}
                    <span className="font-semibold text-sm">
                      {name || "Your Organization"}
                    </span>
                  </div>

                  {/* Step nav bar */}
                  <div
                    className="px-3 py-1.5 flex items-center gap-2 border-b"
                    style={{
                      backgroundColor: stepNavBgColor || "#ffffff",
                      color: stepNavTextColor || "#374151",
                    }}
                  >
                    <span className="text-xs font-medium">Stap 1/3</span>
                    <span className="text-[10px] opacity-70">Naar hoofdstuk</span>
                    <div className="flex-1 h-7 border bg-white/80 px-2 flex items-center text-xs">
                      <span className="truncate">1. Voorbeeld hoofdstuk</span>
                    </div>
                  </div>

                  {/* Progress bar area */}
                  <div
                    className="px-3 py-1.5"
                    style={{
                      backgroundColor: progressBarBgColor || "#ffffff",
                      color: progressBarTextColor || "#6b7280",
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span>Vraag 2 van 5 van het hoofdstuk</span>
                    </div>
                    <div className="h-1 bg-gray-200 overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: "40%",
                          backgroundColor: progressBarColor || primaryColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Page background + question card */}
                  <div
                    className="p-5 space-y-4"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <div
                      className="p-4 border shadow-sm space-y-3"
                      style={{ backgroundColor: questionContainerBgColor || "#ffffff" }}
                    >
                      <h3 className="font-semibold text-sm">
                        Is uw systeem voorzien van een certificering?
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: subtextColor || "#666666" }}
                      >
                        Selecteer het antwoord dat het beste past.
                      </p>

                      <div className="space-y-1.5">
                        <div className="border-2 border-gray-200 p-2.5 flex items-center gap-2 hover:border-gray-300 transition-colors">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          <span className="text-xs">Ja, volledig gecertificeerd</span>
                        </div>
                        <div
                          className="border-2 p-2.5 flex items-center gap-2"
                          style={{ borderColor: primaryColor, backgroundColor: primaryColor + "0d" }}
                        >
                          <div
                            className="h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            style={{ borderColor: primaryColor }}
                          >
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: primaryColor }}>Nee, nog niet</span>
                        </div>
                        <div className="border-2 border-gray-200 p-2.5 flex items-center gap-2 hover:border-gray-300 transition-colors">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          <span className="text-xs">Gedeeltelijk</span>
                        </div>
                      </div>
                    </div>

                    {/* Vorige/Volgende vraag buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        className="px-3 py-1.5 text-xs font-medium border"
                        style={{
                          backgroundColor: prevQuestionButtonColor || previousButtonColor || "#6b7280",
                          borderColor: prevQuestionButtonColor || previousButtonColor || "#6b7280",
                          color: "#fff",
                        }}
                      >
                        ← Vorige vraag
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs font-medium border"
                        style={{
                          backgroundColor: nextQuestionButtonColor || startButtonColor || primaryColor,
                          borderColor: nextQuestionButtonColor || startButtonColor || primaryColor,
                          color: "#fff",
                        }}
                      >
                        Volgende vraag →
                      </button>
                    </div>

                    {/* Start / Vorige buttons */}
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        className="px-3 py-1.5 text-white text-xs font-medium border"
                        style={{
                          backgroundColor: previousButtonColor || "#6b7280",
                          borderColor: previousButtonColor || "#6b7280",
                        }}
                      >
                        ← Vorige
                      </button>
                      <button
                        className="px-3 py-1.5 text-white text-xs font-medium border"
                        style={{
                          backgroundColor: startButtonColor || primaryColor,
                          borderColor: startButtonColor || primaryColor,
                        }}
                      >
                        Start →
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Verification Email Template (HTML)</CardTitle>
                <CardDescription>
                  Configure the email template used for this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[720px]">
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
                  onInit={(_evt: unknown, editor: any) => {
                    editorRef.current = editor;
                  }}
                  value={verificationEmailTemplate}
                  onEditorChange={(content: string) => {
                    setVerificationEmailTemplate(content);
                    if (fieldErrors.verificationEmailTemplate)
                      setFieldErrors((p) => ({
                        ...p,
                        verificationEmailTemplate: undefined,
                      }));
                  }}
                  init={{
                    height: 520,
                    menubar: false,
                    plugins: ["autolink", "link", "lists", "code"],
                    toolbar:
                      "undo redo | blocks | bold italic underline | bullist numlist | link | code",
                    content_style:
                      "body { font-family: Inter, Arial, sans-serif; font-size: 14px; }",
                  }}
                />
                {fieldErrors.verificationEmailTemplate && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.verificationEmailTemplate}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{tenantName}}",
                    "{{verificationUrl}}",
                    "{{recipientEmail}}",
                  ].map((placeholder) => (
                    <Button
                      key={placeholder}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (editorRef.current) {
                          editorRef.current.insertContent(placeholder);
                          return;
                        }
                        setVerificationEmailTemplate(
                          (current) =>
                            `${current}${current ? "\n" : ""}${placeholder}`,
                        );
                      }}
                    >
                      Insert {placeholder}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available placeholders: <code>{"{{tenantName}}"}</code>,{" "}
                  <code>{"{{verificationUrl}}"}</code>,{" "}
                  <code>{"{{recipientEmail}}"}</code>
                </p>
                <Button
                  onClick={submitChanges}
                  disabled={saveMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending
                    ? "Saving..."
                    : saved
                      ? "Saved!"
                      : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Verification Email Preview
                </CardTitle>
                <CardDescription>
                  Live preview with placeholder sample values.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[720px]">
                <div
                  className="rounded-md bg-white p-4 text-sm border min-h-[620px] overflow-auto"
                  dangerouslySetInnerHTML={{
                    __html: renderTemplatePreview(
                      verificationEmailTemplate ||
                        DEFAULT_VERIFICATION_EMAIL_TEMPLATE,
                      name || "Your Organization",
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
