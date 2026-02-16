import { z } from 'zod';

// ─── Login ────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginData = z.infer<typeof loginSchema>;

// ─── Create Tenant ────────────────────────────────────────
export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  logoUrl: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
  faviconUrl: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
  ownerDisplayName: z.string().min(1, 'Display name is required'),
  ownerEmail: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export type CreateTenantData = z.infer<typeof createTenantSchema>;

// ─── Add Tenant User ──────────────────────────────────────
export const addTenantUserSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
});
export type AddTenantUserData = z.infer<typeof addTenantUserSchema>;

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
