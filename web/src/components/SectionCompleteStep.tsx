import { useEffect } from "react";
import type { ChecklistSection } from "@shared/checklist";
import { ChevronRight } from "lucide-react";
import { celebrate } from "../lib/celebrate";

type SectionCompleteStepProps = {
  section: ChecklistSection;
  sectionIndex: number;
  sectionCount: number;
  onContinue: () => void;
};

export default function SectionCompleteStep({
  section,
  sectionIndex,
  sectionCount,
  onContinue,
}: SectionCompleteStepProps) {
  useEffect(() => celebrate(), []);

  return (
    <section className="flex flex-1 flex-col">
      <div className="text-center">
        <p className="text-base text-ink/50">
          Sectie {sectionIndex + 1} van {sectionCount}
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Gefeliciteerd
        </h2>
        <p className="mt-2 text-lg text-ink/70">
          U heeft {section.title} afgerond.
        </p>
      </div>

      {section.illustration && (
        <div className="mt-8 bg-white px-4 py-2">
          <img
            src={section.illustration}
            alt=""
            width={1000}
            height={667}
            className="mx-auto h-auto w-full max-w-lg"
          />
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-md bg-select px-5 py-2.5 text-base font-semibold text-white"
        >
          Volgende sectie
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
