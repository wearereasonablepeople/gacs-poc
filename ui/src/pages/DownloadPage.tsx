import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { PdfData } from "@/lib/pdf";
import { buildPdfFilename, generateSubmissionPdf } from "@/lib/pdf";
import { AlertCircle, CheckCircle2, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface TenantBranding {
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  headerTextColor: string | null;
  subtextColor: string | null;
  faviconUrl: string | null;
}

interface PdfApiResponse {
  id: string;
  submittedAt: string | null;
  respondentEmail: string | null;
  questionnaire: {
    title: string;
    tenant: TenantBranding;
    sections: {
      code: string | null;
      title: string;
      questions: {
        code: string | null;
        prompt: string;
        selectedOption: {
          label: string;
          groupLabel: string | null;
          isAllowed: boolean | null;
        } | null;
        allowedOptions: string[];
      }[];
    }[];
  };
}

type PageState = "loading" | "ready" | "error";

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

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export function DownloadPage() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("submission");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [questionnaireTitle, setQuestionnaireTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!submissionId) {
      setPageState("error");
      setErrorMessage("Geen inzending gevonden. Controleer de URL.");
      return;
    }

    const fetchData = async () => {
      try {
        const { data } = await api.get<PdfApiResponse>(
          `/submissions/${submissionId}/pdf-data`,
        );

        const built: PdfData = {
          questionnaireTitle: data.questionnaire.title,
          tenantName: data.questionnaire.tenant.name,
          respondentEmail: data.respondentEmail,
          submittedAt: data.submittedAt,
          logoUrl: data.questionnaire.tenant.logoUrl,
          sections: data.questionnaire.sections,
        };

        setPdfData(built);
        setTenant(data.questionnaire.tenant);
        setQuestionnaireTitle(data.questionnaire.title);
        setPageState("ready");
      } catch {
        setPageState("error");
        setErrorMessage(
          "Kon de inzendingsgegevens niet ophalen. Probeer het later opnieuw.",
        );
      }
    };

    fetchData();
  }, [submissionId]);

  // Apply branding
  useEffect(() => {
    if (!tenant) return;
    if (tenant.primaryColor) {
      const hsl = hexToHSL(tenant.primaryColor);
      document.documentElement.style.setProperty("--primary", hsl);
      document.documentElement.style.setProperty("--ring", hsl);
      const fg = isLightColor(tenant.primaryColor)
        ? "222 47% 11%"
        : "210 40% 98%";
      document.documentElement.style.setProperty("--primary-foreground", fg);
    }
    if (tenant.secondaryColor) {
      document.documentElement.style.setProperty(
        "--accent",
        hexToHSL(tenant.secondaryColor),
      );
    }
    if (tenant.faviconUrl) {
      let link = document.querySelector(
        "link[rel~='icon']",
      ) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = tenant.faviconUrl;
    }
    document.title = `Download - ${questionnaireTitle} - ${tenant.name}`;
  }, [tenant, questionnaireTitle]);

  const textColor =
    tenant?.headerTextColor ||
    (tenant?.primaryColor
      ? isLightColor(tenant.primaryColor)
        ? "#1e293b"
        : "#ffffff"
      : undefined);
  const headerStyle: React.CSSProperties = tenant?.primaryColor
    ? { backgroundColor: tenant.primaryColor, color: textColor }
    : {};
  const pageBackground: React.CSSProperties = tenant?.secondaryColor
    ? { backgroundColor: tenant.secondaryColor }
    : {};

  const handleDownload = async () => {
    if (!pdfData) return;
    try {
      const doc = await generateSubmissionPdf(pdfData);
      doc.save(buildPdfFilename(pdfData.questionnaireTitle));
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-muted/50 p-4">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-3xl flex items-center gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="mx-auto max-w-2xl p-4 pt-8">
          <Card>
            <CardHeader className="text-center space-y-3">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-full max-w-sm mx-auto" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Er is een fout opgetreden</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50" style={pageBackground}>
      {/* Header */}
      <header
        className={
          tenant?.primaryColor ? "shadow-sm" : "border-b bg-background"
        }
        style={headerStyle}
      >
        <div className="mx-auto max-w-3xl flex items-center gap-3 p-4">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-8 w-8 rounded object-contain"
              style={
                tenant.primaryColor
                  ? { backgroundColor: "rgba(255,255,255,0.2)", padding: "2px" }
                  : undefined
              }
            />
          ) : tenant?.primaryColor ? (
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              {tenant.name?.[0] || "G"}
            </div>
          ) : null}
          <span className="font-semibold text-lg">{tenant?.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 pt-8">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>Uw inzending is voltooid!</CardTitle>
            <CardDescription>
              Uw antwoorden voor <strong>{questionnaireTitle}</strong> zijn
              succesvol ingediend en geverifieerd. U kunt hieronder een PDF
              downloaden met al uw antwoorden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary info */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Vragenlijst:</span>
                <span className="font-medium">{questionnaireTitle}</span>
              </div>
              {pdfData?.respondentEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    Geverifieerd e-mailadres:
                  </span>
                  <span className="font-medium">{pdfData.respondentEmail}</span>
                </div>
              )}
              {pdfData?.submittedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Ingediend op:</span>
                  <span className="font-medium">
                    {new Date(pdfData.submittedAt).toLocaleString("nl-NL")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Aantal secties:</span>
                <span className="font-medium">
                  {pdfData?.sections.length ?? 0}
                </span>
              </div>
            </div>

            {/* Download button */}
            <Button onClick={handleDownload} className="w-full" size="lg">
              <Download className="h-5 w-5" />
              Download PDF met antwoorden
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              U kunt deze pagina bookmarken om later terug te komen en de PDF
              opnieuw te downloaden.
            </p>
            <p className="text-xs text-center text-muted-foreground">
              Wilt u uw gegevens laten verwijderen?{" "}
              <a
                href="/gdpr/erasure"
                className="underline text-primary hover:text-primary/80"
              >
                Verwijderingsverzoek indienen (AVG/GDPR)
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
