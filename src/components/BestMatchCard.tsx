import { Sparkles } from "lucide-react";
import type { CompatibilityResult } from "../lib/compatibility/types";
import { formatGb, humanRuntime, humanTask } from "../lib/utils/format";
import { FitBadge } from "./FitBadge";

type BestMatchCardProps = {
  result?: CompatibilityResult;
};

export function BestMatchCard({ result }: BestMatchCardProps) {
  if (!result) {
    return (
      <article className="summary-card best-card empty-best">
        <p className="eyebrow">Best match</p>
        <h2>No comfortable match yet</h2>
        <p>Try a smaller model filter or switch to a stronger mock profile for testing.</p>
      </article>
    );
  }

  return (
    <article className="summary-card best-card">
      <div className="best-icon" aria-hidden="true">
        <Sparkles size={22} />
      </div>
      <p className="eyebrow">Best match</p>
      <div className="best-title-row">
        <h2>{result.model.name}</h2>
        <FitBadge fit={result.fit} />
      </div>
      <p className="best-reason">{result.reasons[0]}</p>
      <div className="best-meta">
        <span>{humanTask(result.model.task)}</span>
        <span>{formatGb(result.model.requirements.recommendedRamGb)} recommended memory</span>
        <span>{humanRuntime(result.recommendedRuntime)}</span>
      </div>
    </article>
  );
}
