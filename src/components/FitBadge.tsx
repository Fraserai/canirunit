import type { FitLevel } from "../lib/compatibility/types";
import { fitLabel } from "../lib/utils/format";

type FitBadgeProps = {
  fit: FitLevel;
  score?: number;
};

export function FitBadge({ fit, score }: FitBadgeProps) {
  return (
    <span className={`fit-badge fit-${fit}`}>
      <span>{fitLabel(fit)}</span>
      {score !== undefined ? <span className="fit-score">{score}</span> : null}
    </span>
  );
}
