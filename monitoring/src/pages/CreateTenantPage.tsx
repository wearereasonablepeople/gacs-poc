import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { createTenantSchema, getFieldErrors, type FieldErrors, type CreateTenantData } from '@/lib/schemas';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function CreateTenantPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Tenant fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [secondaryColor, setSecondaryColor] = useState('#e2e8f0');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  // Owner fields
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerDisplayName, setOwnerDisplayName] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors<CreateTenantData>>({});

  const createMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create tenant
      const tenantRes = await api.post('/tenants', {
        name,
        slug,
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || undefined,
          faviconUrl: faviconUrl || undefined,
        },
      });
      const tenant = tenantRes.data.tenant ?? tenantRes.data;

      // Step 2: Create owner user
      await api.post(`/tenants/${tenant.id}/users`, {
        email: ownerEmail,
        password: ownerPassword,
        displayName: ownerDisplayName,
        role: 'owner',
      });

      return tenant;
    },
    onSuccess: (tenant) => {
      navigate(`/tenants/${tenant.id}`);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to create tenant');
    },
  });

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const result = getFieldErrors(createTenantSchema, {
      name, slug, primaryColor, secondaryColor,
      logoUrl: logoUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      ownerDisplayName, ownerEmail, ownerPassword,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tenant</h1>
          <p className="text-muted-foreground">Set up a new tenant with an initial owner account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Tenant Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant Details</CardTitle>
            <CardDescription>Basic information about the tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={name}
                  onChange={(e) => { handleNameChange(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined })); }}
                  className={fieldErrors.name ? 'border-destructive' : ''}
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="my-organization"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: undefined })); }}
                  className={fieldErrors.slug ? 'border-destructive' : ''}
                />
                {fieldErrors.slug && <p className="text-xs text-destructive">{fieldErrors.slug}</p>}
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); if (fieldErrors.primaryColor) setFieldErrors((p) => ({ ...p, primaryColor: undefined })); }}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); if (fieldErrors.primaryColor) setFieldErrors((p) => ({ ...p, primaryColor: undefined })); }}
                    placeholder="#1e40af"
                    className={fieldErrors.primaryColor ? 'border-destructive' : ''}
                  />
                </div>
                {fieldErrors.primaryColor && <p className="text-xs text-destructive">{fieldErrors.primaryColor}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => { setSecondaryColor(e.target.value); if (fieldErrors.secondaryColor) setFieldErrors((p) => ({ ...p, secondaryColor: undefined })); }}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => { setSecondaryColor(e.target.value); if (fieldErrors.secondaryColor) setFieldErrors((p) => ({ ...p, secondaryColor: undefined })); }}
                    placeholder="#e2e8f0"
                    className={fieldErrors.secondaryColor ? 'border-destructive' : ''}
                  />
                </div>
                {fieldErrors.secondaryColor && <p className="text-xs text-destructive">{fieldErrors.secondaryColor}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => { setLogoUrl(e.target.value); if (fieldErrors.logoUrl) setFieldErrors((p) => ({ ...p, logoUrl: undefined })); }}
                  className={fieldErrors.logoUrl ? 'border-destructive' : ''}
                />
                {fieldErrors.logoUrl && <p className="text-xs text-destructive">{fieldErrors.logoUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  type="url"
                  placeholder="https://example.com/favicon.ico"
                  value={faviconUrl}
                  onChange={(e) => { setFaviconUrl(e.target.value); if (fieldErrors.faviconUrl) setFieldErrors((p) => ({ ...p, faviconUrl: undefined })); }}
                  className={fieldErrors.faviconUrl ? 'border-destructive' : ''}
                />
                {fieldErrors.faviconUrl && <p className="text-xs text-destructive">{fieldErrors.faviconUrl}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Initial Owner Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Initial Owner Account</CardTitle>
            <CardDescription>
              Create the first admin user for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerDisplayName">Display Name</Label>
              <Input
                id="ownerDisplayName"
                placeholder="John Doe"
                value={ownerDisplayName}
                onChange={(e) => { setOwnerDisplayName(e.target.value); if (fieldErrors.ownerDisplayName) setFieldErrors((p) => ({ ...p, ownerDisplayName: undefined })); }}
                className={fieldErrors.ownerDisplayName ? 'border-destructive' : ''}
              />
              {fieldErrors.ownerDisplayName && <p className="text-xs text-destructive">{fieldErrors.ownerDisplayName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="owner@example.com"
                value={ownerEmail}
                onChange={(e) => { setOwnerEmail(e.target.value); if (fieldErrors.ownerEmail) setFieldErrors((p) => ({ ...p, ownerEmail: undefined })); }}
                className={fieldErrors.ownerEmail ? 'border-destructive' : ''}
              />
              {fieldErrors.ownerEmail && <p className="text-xs text-destructive">{fieldErrors.ownerEmail}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Minimum 8 characters"
                value={ownerPassword}
                onChange={(e) => { setOwnerPassword(e.target.value); if (fieldErrors.ownerPassword) setFieldErrors((p) => ({ ...p, ownerPassword: undefined })); }}
                className={fieldErrors.ownerPassword ? 'border-destructive' : ''}
              />
              {fieldErrors.ownerPassword && <p className="text-xs text-destructive">{fieldErrors.ownerPassword}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
