import { useRef } from "react";
import type { ChecklistSection } from "@shared/checklist";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCompactNavLabels } from "../hooks/useCompactNavLabels";
import NavLabel from "./NavLabel";

type SectionIntroStepProps = {
  section: ChecklistSection;
  sectionIndex: number;
  sectionCount: number;
  onPreviousSection: () => void;
  onSkipSection: () => void;
  onStart: () => void;
};

export default function SectionIntroStep({
  section,
  sectionIndex,
  sectionCount,
  onPreviousSection,
  onSkipSection,
  onStart,
}: SectionIntroStepProps) {
  const isFirstSection = sectionIndex === 0;
  const navRef = useRef<HTMLDivElement>(null);
  const compact = useCompactNavLabels(navRef);

  return (
    <section className="flex-1">
      <div className="mb-6">
        <p className="text-base text-ink/50">
          Sectie {sectionIndex + 1} van {sectionCount}
        </p>
        <h2 className="font-display text-3xl text-ink">{section.title}</h2>
        {section.description && (
          <p className="mt-1 text-base text-ink/65">{section.description}</p>
        )}
      </div>

      {section.illustration && (
        <div className="mb-6 bg-white">
          <img
            src={section.illustration}
            alt=""
            width={1000}
            height={667}
            className="mx-auto h-auto w-full max-w-lg"
          />
        </div>
      )}

      <div
        ref={navRef}
        className={`mt-8 flex flex-nowrap items-center gap-3 ${
          isFirstSection ? "justify-end" : "justify-between"
        }`}
      >
        {!isFirstSection && (
          <button
            type="button"
            onClick={onPreviousSection}
            className="inline-flex shrink-0 items-center gap-2 rounded-md pl-0 pr-4 py-2 text-base font-semibold text-pine"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <NavLabel parts={["Vorige", "sectie"]} compact={compact} />
          </button>
        )}
        <div className="flex flex-nowrap items-center gap-3">
          <button
            type="button"
            onClick={onSkipSection}
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-base font-semibold text-pine"
          >
            <NavLabel parts={["Sectie", "overslaan"]} compact={compact} />
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-select px-5 py-2.5 text-base font-semibold text-white"
          >
            Start <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
    </section>
  );
}
