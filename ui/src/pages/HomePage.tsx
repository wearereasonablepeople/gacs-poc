import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Questionnaire Platform</CardTitle>
          <CardDescription>
            Gebruik de link die u heeft ontvangen om uw vragenlijst in te vullen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open de directe URL naar uw vragenlijst om te beginnen, bijvoorbeeld:<br />
            <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs">
              /company/questionnaire
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
