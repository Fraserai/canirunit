import type { ModelVariant, Runtime } from "../catalog/types";

export type FitLevel = "perfect" | "good" | "stretch" | "not_recommended";

export type CompatibilityResult = {
  model: ModelVariant;
  fit: FitLevel;
  score: number;
  reasons: string[];
  warnings: string[];
  recommendedRuntime?: Runtime;
};
