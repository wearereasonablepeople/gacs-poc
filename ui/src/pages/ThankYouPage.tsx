import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <CardTitle>Bedankt!</CardTitle>
          <CardDescription>
            Uw inzending is succesvol ontvangen en geverifieerd. U kunt dit venster nu sluiten.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
