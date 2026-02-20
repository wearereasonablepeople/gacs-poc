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

interface TenantBranding {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  headerTextColor: string;
  subtextColor: string;
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
                  <Label htmlFor="name">Organization Name</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      if (fieldErrors.logoUrl)
                        setFieldErrors((p) => ({ ...p, logoUrl: undefined }));
                    }}
                    placeholder="https://example.com/logo.png"
                    className={fieldErrors.logoUrl ? "border-destructive" : ""}
                  />
                  {fieldErrors.logoUrl && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.logoUrl}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={faviconUrl}
                    onChange={(e) => {
                      setFaviconUrl(e.target.value);
                      if (fieldErrors.faviconUrl)
                        setFieldErrors((p) => ({
                          ...p,
                          faviconUrl: undefined,
                        }));
                    }}
                    placeholder="https://example.com/favicon.ico"
                    className={
                      fieldErrors.faviconUrl ? "border-destructive" : ""
                    }
                  />
                  {fieldErrors.faviconUrl && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.faviconUrl}
                    </p>
                  )}
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
                <div className="rounded-lg border overflow-hidden">
                  <div
                    className="p-4 flex items-center gap-3"
                    style={{
                      backgroundColor: primaryColor,
                      color: headerTextColor || "#fff",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-8 w-8 rounded object-contain bg-white/20 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-sm font-bold">
                        {name?.[0] || "G"}
                      </div>
                    )}
                    <span className="font-semibold">
                      {name || "Your Organization"}
                    </span>
                  </div>

                  <div
                    className="p-6 space-y-4"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: primaryColor }}
                      >
                        Sample Questionnaire
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: subtextColor || "#666666" }}
                      >
                        This is how your questionnaire will look with the
                        current branding settings.
                      </p>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Sample Question
                        </label>
                        <div className="h-10 rounded-md border bg-gray-50" />
                      </div>

                      <button
                        className="px-4 py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Submit
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
