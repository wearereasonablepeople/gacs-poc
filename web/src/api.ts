import type { ChecklistSection } from "@shared/checklist";

export type ProviderInfo = {
  name: string;
  url: string | null;
  email: string | null;
  phone: string | null;
};

export type ChecklistResponse = {
  sections: ChecklistSection[];
  controlPointCount: number;
  provider: ProviderInfo;
};

export async function fetchChecklist(): Promise<ChecklistResponse> {
  const res = await fetch("/api/checklist");
  if (!res.ok) throw new Error("Checklist laden mislukt");
  return res.json();
}

export async function submitChecklist(input: {
  email: string;
  answers: Record<string, string>;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Versturen mislukt");
  }
  return data;
}
