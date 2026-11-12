import type { ModelVariant } from "../catalog/types";
import type { MachineProfile } from "../scanner/types";
import { getPracticalRuntimes } from "./runtimeRecommendation";

export type ScoreBreakdown = {
  memory: number;
  accelerator: number;
  runtime: number;
  disk: number;
  ease: number;
  confidence: number;
};

function bestVramGb(machine: MachineProfile): number | undefined {
  const values = machine.gpu
    .map((gpu) => gpu.vramGb)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) return undefined;
  return Math.max(...values);
}

function scoreMemory(machine: MachineProfile, model: ModelVariant): number {
  const total = machine.memory.totalGb;
  const recommended = model.requirements.recommendedRamGb;
  const minimum = model.requirements.minRamGb;

  if (total >= recommended * 1.25) return 35;
  if (total >= recommended) return 30;
  if (total >= minimum * 1.15) return 22;
  if (total >= minimum) return 15;
  return Math.max(0, Math.round((total / minimum) * 10));
}

function scoreAccelerator(machine: MachineProfile, model: ModelVariant): number {
  const required = model.requirements.requiredAccelerators ?? [];
  const preferred = model.requirements.preferredAccelerators ?? [];
  const bestVram = bestVramGb(machine);

  if (required.length > 0 && !required.some((accelerator) => machine.accelerators.includes(accelerator))) {
    return machine.accelerators.includes("cpu") && !model.requirements.minVramGb ? 8 : 0;
  }

  if (model.requirements.recommendedVramGb !== undefined) {
    if (bestVram === undefined) return machine.accelerators.includes("metal") ? 18 : 8;
    if (bestVram >= model.requirements.recommendedVramGb) return 25;
    if (bestVram >= (model.requirements.minVramGb ?? 0)) return 16;
    return 4;
  }

  if (preferred.length > 0 && preferred.some((accelerator) => machine.accelerators.includes(accelerator))) {
    return 25;
  }

  return machine.accelerators.includes("cpu") ? 20 : 10;
}

function scoreRuntime(machine: MachineProfile, model: ModelVariant): number {
  const runtimes = getPracticalRuntimes(model, machine);
  if (runtimes.length === 0) return 0;
  if (runtimes.includes("ollama") || runtimes.includes("mlx")) return 15;
  if (runtimes.includes("llama.cpp") || runtimes.includes("diffusers")) return 12;
  return 10;
}

function scoreDisk(machine: MachineProfile, model: ModelVariant): number {
  if (machine.disk.freeGb === undefined) return 7;
  if (machine.disk.freeGb >= model.requirements.diskGb * 2) return 10;
  if (machine.disk.freeGb >= model.requirements.diskGb) return 7;
  return 0;
}

function scoreConfidence(model: ModelVariant): number {
  let score = 2;
  if (model.sourceUrl) score += 1;
  if (model.lastUpdated) score += 1;
  if (!model.license.toLowerCase().includes("unknown")) score += 1;
  return Math.min(5, score);
}

export function scoreModel(machine: MachineProfile, model: ModelVariant): ScoreBreakdown {
  return {
    memory: scoreMemory(machine, model),
    accelerator: scoreAccelerator(machine, model),
    runtime: scoreRuntime(machine, model),
    disk: scoreDisk(machine, model),
    ease: model.qualityHints.easeOfUse * 2,
    confidence: scoreConfidence(model),
  };
}

export function totalScore(score: ScoreBreakdown): number {
  return Math.min(
    100,
    Math.round(score.memory + score.accelerator + score.runtime + score.disk + score.ease + score.confidence),
  );
}
