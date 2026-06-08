import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function GdprErasurePage() {
  const [email, setEmail] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [emailError, setEmailError] = useState('');

  const erasureMutation = useMutation({
    mutationFn: async () => {
      await api.post('/gdpr/erasure-request', { email, tenantSlug });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!email || !email.includes('@')) {
      setEmailError('Voer een geldig e-mailadres in.');
      return;
    }
    if (!tenantSlug.trim()) {
      setEmailError('Voer de organisatie-ID in.');
      return;
    }
    setEmailError('');
    erasureMutation.mutate();
  }, [email, tenantSlug, erasureMutation]);

  if (erasureMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>Verzoek verwerkt</CardTitle>
            <CardDescription>
              Als uw e-mailadres bij ons bekend is, zijn alle bijbehorende persoonsgegevens verwijderd.
              Dit omvat uw e-mailadres, verificatiegegevens en de koppeling met uw antwoorden.
              Geanonimiseerde antwoorden kunnen bewaard worden voor statistische doeleinden.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-3xl flex items-center gap-3 p-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">AVG / GDPR</span>
        </div>
      </header>

      <div className="mx-auto max-w-lg p-4 pt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verwijderingsverzoek (Right to Erasure)
            </CardTitle>
            <CardDescription>
              Op grond van artikel 17 van de AVG (GDPR) heeft u het recht om verwijdering van uw
              persoonsgegevens te verzoeken. Vul het onderstaande formulier in om al uw gegevens
              bij een specifieke organisatie te laten verwijderen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible defaultValue="deleted" className="rounded-lg border bg-muted/50 text-sm">
              <AccordionItem value="deleted" className="border-b-0 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">Wat wordt verwijderd</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Uw e-mailadres en verificatiegegevens</li>
                    <li>De koppeling tussen uw identiteit en uw antwoorden</li>
                    <li>Alle verificatietokens</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kept" className="px-4">
                <AccordionTrigger className="py-4 hover:no-underline">Wat wordt behouden (geanonimiseerd)</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Geanonimiseerde antwoorden (niet meer herleidbaar tot u)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-2">
              <Label htmlFor="erasure-email">E-mailadres</Label>
              <Input
                id="erasure-email"
                type="email"
                placeholder="uw@email.nl"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Organisatie-ID</Label>
              <Input
                id="tenant-slug"
                type="text"
                placeholder="bijv. company"
                value={tenantSlug}
                onChange={(e) => {
                  setTenantSlug(e.target.value);
                  if (emailError) setEmailError('');
                }}
              />
              <p className="text-xs text-muted-foreground">
                De organisatie-ID vindt u in de URL van de vragenlijst (bijv. company/questionnaire).
              </p>
            </div>

            {emailError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {emailError}
              </div>
            )}

            <div className="flex items-start space-x-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <Checkbox
                id="confirm-erasure"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label htmlFor="confirm-erasure" className="text-xs leading-snug cursor-pointer">
                Ik begrijp dat dit verzoek onomkeerbaar is. Alle persoonsgegevens gekoppeld aan mijn
                e-mailadres bij de opgegeven organisatie worden permanent verwijderd.
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!confirmed || erasureMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              {erasureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Verwijderingsverzoek indienen
            </Button>

            {erasureMutation.isError && (
              <p className="text-sm text-destructive text-center">
                Er is een fout opgetreden. Probeer het later opnieuw.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
