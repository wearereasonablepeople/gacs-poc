import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const submissionId = searchParams.get('submission');

  const [state, setState] = useState<VerifyState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const calledRef = useRef(false);

  const verify = async () => {
    if (!token || !submissionId) {
      setState('error');
      setErrorMessage('De verificatielink is ongeldig. De benodigde parameters ontbreken.');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      await api.get(`/verify-email?token=${token}&submission=${submissionId}`);
      setState('success');
    } catch (err: unknown) {
      let message = 'De verificatielink is ongeldig of verlopen.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        const apiMessage = response?.data?.message;
        if (apiMessage?.includes('expired') || apiMessage?.includes('verlopen')) {
          message = 'De verificatielink is verlopen. Vraag een nieuwe verificatie-e-mail aan.';
        } else if (apiMessage?.includes('revoked')) {
          message = 'De verificatielink is ingetrokken.';
        }
      }
      setState('error');
      setErrorMessage(message);
    }
  };

  // Run verification once on mount (ref guard prevents StrictMode double-fire)
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    verify();
  }, []);

  // Countdown + redirect after successful verification
  useEffect(() => {
    if (state !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/download?submission=${submissionId}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, submissionId, navigate]);

  if (state === 'idle' || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-full max-w-xs mx-auto" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Verificatie mislukt</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const progressPercent = ((5 - countdown) / 5) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <CardTitle>E-mail geverifieerd!</CardTitle>
          <CardDescription>
            Uw e-mailadres is bevestigd en uw inzending is voltooid. Bedankt voor uw deelname.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            U wordt over {countdown} seconde{countdown !== 1 ? 'n' : ''} doorgestuurd naar de downloadpagina…
          </p>
          <Progress value={progressPercent} className="w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
