import { LoaderCircle } from "lucide-react";

const scanningSteps = [
  "Checking your hardware...",
  "Detecting memory...",
  "Detecting graphics...",
  "Matching open-source models...",
];

type ScanningScreenProps = {
  stepIndex: number;
};

export function ScanningScreen({ stepIndex }: ScanningScreenProps) {
  const activeIndex = Math.min(stepIndex, scanningSteps.length - 1);

  return (
    <main className="scan-shell" aria-live="polite">
      <section className="scan-panel">
        <LoaderCircle className="scan-spinner" size={34} aria-hidden="true" />
        <h1>{scanningSteps[activeIndex]}</h1>
        <div className="scan-progress" aria-hidden="true">
          <span style={{ width: `${((activeIndex + 1) / scanningSteps.length) * 100}%` }} />
        </div>
        <ol className="scan-steps">
          {scanningSteps.map((step, index) => (
            <li key={step} className={index <= activeIndex ? "complete" : ""}>
              {step.replace("...", "")}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
