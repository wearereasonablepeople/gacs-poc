export const INTRO_FALLBACK_IMAGE_PATH = "/pdf-assets/0.png";

const MIN_SECTION_ASSET = 1;
const MAX_SECTION_ASSET = 7;

export function parseSectionAssetNumber(
  code: string | null,
  sectionIndex: number,
): number | null {
  let n: number;
  if (code != null && code !== "") {
    const parsed = parseInt(code, 10);
    n = Number.isFinite(parsed) ? parsed : sectionIndex + 1;
  } else {
    n = sectionIndex + 1;
  }
  if (n < MIN_SECTION_ASSET || n > MAX_SECTION_ASSET) return null;
  return n;
}

export function getSectionFallbackImagePath(
  code: string | null,
  sectionIndex: number,
): string | null {
  const n = parseSectionAssetNumber(code, sectionIndex);
  if (n == null) return null;
  return `/pdf-assets/${n}.png`;
}

export function getSectionDisplayImageUrl(
  section: { code: string | null; imageUrl: string | null },
  sectionIndex: number,
  resolveImageUrl: (url: string | null | undefined) => string | undefined,
): string | undefined {
  if (section.imageUrl) {
    return resolveImageUrl(section.imageUrl);
  }
  return getSectionFallbackImagePath(section.code, sectionIndex) ?? undefined;
}

export function getIntroDisplayImageUrl(
  introImageUrl: string | null,
  resolveImageUrl: (url: string | null | undefined) => string | undefined,
): string | undefined {
  if (introImageUrl) {
    return resolveImageUrl(introImageUrl);
  }
  return INTRO_FALLBACK_IMAGE_PATH;
}
