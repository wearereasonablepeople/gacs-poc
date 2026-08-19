import { CHECKLIST_HERO_ILLUSTRATION } from "@shared/checklist";
import ChecklistIntro from "./ChecklistIntro";

type WelcomeStepProps = {
  onStart: () => void;
};

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <section className="flex flex-1 flex-col">
      <ChecklistIntro />
      <div className="bg-white px-6">
        <img
          src={CHECKLIST_HERO_ILLUSTRATION}
          alt=""
          width={1000}
          height={667}
          className="mx-auto h-auto w-full max-w-lg"
        />
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 mx-auto inline-flex w-fit items-center rounded-md bg-select px-5 py-2.5 text-base font-semibold text-white"
      >
        Beginnen
      </button>
    </section>
  );
}
