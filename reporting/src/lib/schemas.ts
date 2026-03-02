import { z } from "zod";

// ─── Login ────────────────────────────────────────────────
export const loginSchema = z.object({
  tenantSlug: z.string().min(1, "Tenant is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginData = z.infer<typeof loginSchema>;

// ─── Create Questionnaire ─────────────────────────────────
export const createQuestionnaireSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
});
export type CreateQuestionnaireData = z.infer<typeof createQuestionnaireSchema>;

// ─── Section ──────────────────────────────────────────────
export const sectionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z.string().optional(),
});
export type SectionData = z.infer<typeof sectionSchema>;

// ─── Question ─────────────────────────────────────────────
export const questionSchema = z.object({
  prompt: z.string().min(1, "Question text is required"),
  helpText: z.string().optional(),
  isRequired: z.boolean(),
});
export type QuestionData = z.infer<typeof questionSchema>;

// ─── Option ───────────────────────────────────────────────
export const optionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  isAllowed: z.boolean().nullable().optional(),
});
export type OptionData = z.infer<typeof optionSchema>;

// ─── Invite User ──────────────────────────────────────────
export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["tenant_admin", "tenant_owner"]),
});
export type InviteUserData = z.infer<typeof inviteUserSchema>;

// ─── Branding ─────────────────────────────────────────────
export const brandingSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #003366)"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #e8f0fe)"),
  headerTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #ffffff)")
    .optional()
    .or(z.literal("")),
  subtextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #cccccc)")
    .optional()
    .or(z.literal("")),
  startButtonColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  previousButtonColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  nextQuestionButtonColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  prevQuestionButtonColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  stepNavBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  stepNavTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  progressBarBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  progressBarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  progressBarTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  questionContainerBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  activeChapterIndicatorColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .union([z.string().url("Must be a valid URL"), z.string().startsWith("/api/"), z.literal("")])
    .optional(),
  faviconUrl: z
    .union([z.string().url("Must be a valid URL"), z.string().startsWith("/api/"), z.literal("")])
    .optional(),
  notificationEmail: z
    .union([z.string().email("Must be a valid email address"), z.literal("")])
    .optional(),
  verificationEmailTemplate: z
    .string()
    .max(50000, "Template must be 50,000 characters or less")
    .optional(),
});
export type BrandingData = z.infer<typeof brandingSchema>;

// ─── Helpers ──────────────────────────────────────────────
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function getFieldErrors<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: FieldErrors<T> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: FieldErrors<T> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof T;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}
