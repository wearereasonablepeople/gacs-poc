type WelcomeStepProps = {
  onStart: () => void;
};

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <section className="flex flex-1 flex-col">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        GACS Checker
      </p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        Checklist technische eisen
      </h1>
      <p className="mt-3 max-w-2xl text-base text-ink/70">
        Beantwoord de control points die van toepassing zijn. U mag punten
        openlaten. Na afloop ontvangt u de resultaten per e-mail.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex w-fit items-center rounded-md bg-select px-5 py-2.5 text-sm font-semibold text-white"
      >
        Beginnen
      </button>
    </section>
  );
}
