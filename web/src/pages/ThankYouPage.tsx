import { Link, useLocation } from "react-router-dom";
import type { ProviderInfo } from "../api";

export default function ThankYouPage() {
  const location = useLocation();
  const provider = (location.state as { provider?: ProviderInfo } | null)?.provider;

  const name = provider?.name || "onze specialisten";

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        GACS Checker
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Bedankt</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/75">
        Uw resultaten zijn onderweg naar uw inbox. Check ook uw spammap als u
        niets ziet.
      </p>

      <div className="mt-8 border border-pine/15 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-pine/70">
          Volgende stap
        </p>
        <p className="mt-2 font-display text-2xl text-ink">
          Neem contact op met {name}
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          {provider?.url && (
            <a
              className="font-semibold text-accent underline-offset-2 hover:underline"
              href={provider.url}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
          )}
          {provider?.email && (
            <a
              className="font-semibold text-accent underline-offset-2 hover:underline"
              href={`mailto:${provider.email}`}
            >
              {provider.email}
            </a>
          )}
          {provider?.phone && (
            <a
              className="font-semibold text-accent underline-offset-2 hover:underline"
              href={`tel:${provider.phone}`}
            >
              {provider.phone}
            </a>
          )}
          {!provider?.url && !provider?.email && !provider?.phone && (
            <p className="text-ink/60">
              Gebruik de contactgegevens van {name} voor een vervolggesprek.
            </p>
          )}
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 inline-flex w-fit rounded-md bg-pine px-5 py-2.5 text-sm font-semibold text-sand"
      >
        Opnieuw beginnen
      </Link>
    </div>
  );
}
